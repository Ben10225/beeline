package models

import (
	"beeline/configs"
	"beeline/structs"
	"context"
	"fmt"
	"log"
	"sort"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var coll *mongo.Collection = configs.GetCollection(configs.DB, "rooms")

func InsertUserToRoom(c *gin.Context, roomId, uuid, name, imgUrl string, audio, video, auth bool) bool {
	var result structs.RoomInfo
	findFilter := bson.D{{"roomId", roomId}}
	resError := coll.FindOne(context.TODO(), findFilter).Decode(&result)

	var tpZone = time.FixedZone("GMT", 8*3600)

	if resError != nil {
		docs := []interface{}{
			gin.H{
				"roomId":      roomId,
				"chatOpen":    true,
				"screenShare": false,
				"roomCreated": time.Now().In(tpZone).Format("2006-01-02 15:04:05"),
				"user":        []structs.RoomUserData{},
				// User:   []interface{}{uuid, audio, video, true},
			},
		}
		_, err := coll.InsertMany(context.TODO(), docs)
		if err != nil {
			log.Println(err)
			return false
		}
	}

	user := result.User
	for _, v := range user {
		if v.Uuid == uuid {
			return false
		}
	}

	filter := bson.D{{"roomId", roomId}}
	// userInfo := bson.D{{
	// 	"$push", bson.D{{
	// 		"user", bson.D{
	// 			{"uuid", uuid},
	// 			{"audioStatus", audio},
	// 			{"videoStatus", video},
	// 			{"auth", auth},
	// 			{"leave", false},
	// 		},
	// 	}},
	// }}
	var leaveStatus bool
	if auth {
		leaveStatus = false
	} else {
		leaveStatus = true
	}

	userInfo := bson.M{
		"$push": bson.M{
			"user": bson.D{
				{"uuid", uuid},
				{"name", name},
				{"imgUrl", imgUrl},
				{"audioStatus", audio},
				{"videoStatus", video},
				{"auth", auth},
				{"leave", leaveStatus},
				{"sec", 5},
				{"gameClick", false},
			},
		},
	}
	_, err := coll.UpdateOne(context.TODO(), filter, userInfo)
	if err != nil {
		log.Println(err)
		return false
	}
	return true
}

func UserLeaveTrue(c *gin.Context, roomId, uuid string, auth bool) bool {
	filter := bson.D{{"roomId", roomId}}
	if !auth {
		coll.FindOneAndUpdate(
			context.Background(),
			filter,
			bson.M{"$set": bson.M{"user.$[elem].leave": true}},
			options.FindOneAndUpdate().SetArrayFilters(options.ArrayFilters{
				Filters: []interface{}{bson.M{"elem.uuid": uuid}},
			}),
		)
	} else {
		coll.FindOneAndUpdate(
			context.Background(),
			filter,
			bson.M{"$set": bson.M{"user.$[elem].auth": false, "user.$[elem].leave": true}},
			options.FindOneAndUpdate().SetArrayFilters(options.ArrayFilters{
				Filters: []interface{}{bson.M{"elem.uuid": uuid}},
			}),
		)
	}

	var result structs.RoomInfo
	er := coll.FindOne(context.TODO(), filter).Decode(&result)
	if er != nil {
		log.Println(roomId, er)
	}
	user := result.User

	stillUserInRoom := false
	stillAuthInRoom := false
	newAuth := ""

	for _, v := range user {
		if !v.Leave {
			stillUserInRoom = true
			// return false
		}
		if v.Auth {
			stillAuthInRoom = true
		}
		if !v.Auth && newAuth == "" && !v.Leave {
			newAuth = v.Uuid
		}
	}

	if !stillAuthInRoom {
		coll.FindOneAndUpdate(
			context.Background(),
			filter,
			bson.M{"$set": bson.M{"user.$[elem].auth": true}},
			options.FindOneAndUpdate().SetArrayFilters(options.ArrayFilters{
				Filters: []interface{}{bson.M{"elem.uuid": newAuth}},
			}),
		)
	}

	if stillUserInRoom {
		return false
	}

	_, err := coll.DeleteOne(context.TODO(), bson.M{"roomId": roomId})
	if err != nil {
		fmt.Println(err)
	}
	return true
}

func PullUserData(c *gin.Context, roomId, uuid string) {
	filter := bson.D{{"roomId", roomId}}
	userInfo := bson.M{
		"$pull": bson.M{
			"user": bson.D{
				{"uuid", uuid},
			},
		},
	}
	_, err := coll.UpdateOne(context.TODO(), filter, userInfo)
	if err != nil {
		log.Println(err)
	}

	var result structs.RoomInfo
	er := coll.FindOne(context.TODO(), filter).Decode(&result)
	if er != nil {
		log.Println(roomId, er)
	}
	user := result.User
	if len(user) != 0 {
		for _, v := range user {
			if !v.Leave {
				return
			}
		}
	}
	_, err = coll.DeleteOne(context.TODO(), bson.M{"roomId": roomId})
	if err != nil {
		fmt.Println(err)
	}
}

func GetUserInRoom(c *gin.Context, roomId, uuid string) bool {
	var room structs.RoomInfo
	filter := bson.D{{"roomId", roomId}}
	err := coll.FindOne(context.TODO(), filter).Decode(&room)
	if err != nil {
		log.Println(err)
		return false
	}

	user := room.User
	for _, v := range user {
		if v.Uuid == uuid {
			return true
		}
	}
	return false
}

func FindRoom(c *gin.Context, roomId string) bool {
	var room structs.RoomInfo
	filter := bson.D{{"roomId", roomId}}
	err := coll.FindOne(context.TODO(), filter).Decode(&room)
	return err == nil
}

func SetStreamStatus(c *gin.Context, roomId, uuid, status string, b bool) {
	filter := bson.D{{"roomId", roomId}}

	var s string
	if status == "video" {
		s = "videoStatus"
	} else {
		s = "audioStatus"
	}

	coll.FindOneAndUpdate(
		context.Background(),
		filter,
		bson.M{"$set": bson.M{fmt.Sprintf("user.$[elem].%s", s): b}},
		options.FindOneAndUpdate().SetArrayFilters(options.ArrayFilters{
			Filters: []interface{}{bson.M{"elem.uuid": uuid}},
		}),
	)
}

func GetStatusByUuid(c *gin.Context, roomId, uuid string) *structs.RoomUserData {
	var room structs.RoomInfo
	filter := bson.D{{"roomId", roomId}}
	err := coll.FindOne(context.TODO(), filter).Decode(&room)
	if err != nil {
		log.Println(err)
		return nil
	}

	user := room.User
	for _, v := range user {
		if v.Uuid == uuid {
			return &v
		}
	}
	return nil
}

func CheckAuthAlready(c *gin.Context, roomId string) (bool, string) {
	var room structs.RoomInfo
	filter := bson.D{{"roomId", roomId}}
	coll.FindOne(context.TODO(), filter).Decode(&room)

	user := room.User
	for _, v := range user {
		if v.Auth {
			return true, v.Uuid
		}
	}
	return false, ""
}

func UserBackToRoomLeaveStatus(c *gin.Context, roomId, uuid string) {
	filter := bson.D{{"roomId", roomId}}

	coll.FindOneAndUpdate(
		context.Background(),
		filter,
		bson.M{"$set": bson.M{"user.$[elem].leave": false}},
		options.FindOneAndUpdate().SetArrayFilters(options.ArrayFilters{
			Filters: []interface{}{bson.M{"elem.uuid": uuid}},
		}),
	)
}

func GetRoomNewHost(c *gin.Context, roomId, uuid string) (string, bool) {
	var room structs.RoomInfo
	filter := bson.D{{"roomId", roomId}}
	coll.FindOne(context.TODO(), filter).Decode(&room)

	chatOpen := room.ChatOpen
	user := room.User
	var result string

	for _, v := range user {
		if v.Auth {
			result = v.Uuid
		}
	}
	return result, chatOpen
}

func SetRoomChatStatus(c *gin.Context, roomId string, b bool) {
	filter := bson.D{{"roomId", roomId}}
	update := bson.D{{"$set", bson.D{{"chatOpen", b}}}}
	_, err := coll.UpdateOne(context.TODO(), filter, update)
	if err != nil {
		log.Fatal(err)
	}
}

func GetRoomChatAndShareStatus(c *gin.Context, roomId string) (bool, bool) {
	var room structs.RoomInfo
	filter := bson.D{{"roomId", roomId}}
	err := coll.FindOne(context.TODO(), filter).Decode(&room)
	if err != nil {
		fmt.Println(err)
	}

	chat := room.ChatOpen
	screenShare := room.ScreenShare
	return chat, screenShare
}

func GetGroupInfoData(c *gin.Context, roomId string) ([]gin.H, string) {
	var room structs.RoomInfo
	filter := bson.D{{"roomId", roomId}}
	err := coll.FindOne(context.TODO(), filter).Decode(&room)
	if err != nil {
		fmt.Println(err)
	}
	user := room.User
	var host string
	var result []gin.H

	for _, v := range user {
		if !v.Leave {
			soloData := gin.H{
				"uuid":        v.Uuid,
				"audioStatus": v.AudioStatus,
			}
			result = append(result, soloData)
		}
		if v.Auth {
			host = v.Uuid
		}
	}
	return result, host
}

func AssignNewAuth(c *gin.Context, roomId, oldUuid, newUuid string) string {
	var room structs.RoomInfo
	filter := bson.D{{"roomId", roomId}}
	err := coll.FindOne(context.TODO(), filter).Decode(&room)
	if err != nil {
		fmt.Println(err)
	}
	user := room.User
	for _, v := range user {
		if v.Auth && v.Uuid != oldUuid {
			return "bad request"
		}
	}
	coll.FindOneAndUpdate(
		context.Background(),
		filter,
		bson.M{"$set": bson.M{"user.$[elem].auth": false}},
		options.FindOneAndUpdate().SetArrayFilters(options.ArrayFilters{
			Filters: []interface{}{bson.M{"elem.uuid": oldUuid}},
		}),
	)
	coll.FindOneAndUpdate(
		context.Background(),
		filter,
		bson.M{"$set": bson.M{"user.$[elem].auth": true}},
		options.FindOneAndUpdate().SetArrayFilters(options.ArrayFilters{
			Filters: []interface{}{bson.M{"elem.uuid": newUuid}},
		}),
	)
	return "ok"
}

func SetScreenShare(c *gin.Context, roomId string, b bool) {
	filter := bson.D{{"roomId", roomId}}
	update := bson.D{{"$set", bson.D{{"screenShare", b}}}}
	_, err := coll.UpdateOne(context.TODO(), filter, update)
	if err != nil {
		log.Fatal(err)
	}
}

func ChangeRoomUserDataGameSetting(c *gin.Context, roomId, uuid string, sec float64, click bool) bool {
	filter := bson.D{{"roomId", roomId}}
	coll.FindOneAndUpdate(
		context.Background(),
		filter,
		bson.M{"$set": bson.M{
			"user.$[elem].sec":       sec,
			"user.$[elem].gameClick": click,
		}},
		options.FindOneAndUpdate().SetArrayFilters(options.ArrayFilters{
			Filters: []interface{}{bson.M{"elem.uuid": uuid}},
		}),
	)
	var room structs.RoomInfo
	err := coll.FindOne(context.TODO(), filter).Decode(&room)
	if err != nil {
		fmt.Println(err)
	}

	user := room.User

	for _, v := range user {
		if !v.Leave && !v.GameClick {
			return false
		}
	}
	return true
}

func GetGameSlice(c *gin.Context, roomId string) ([]structs.Game, []structs.GameInfoArray) {
	var room structs.RoomInfo
	filter := bson.D{{"roomId", roomId}}
	err := coll.FindOne(context.TODO(), filter).Decode(&room)
	if err != nil {
		fmt.Println(err)
	}
	user := room.User
	userSec := map[string]float64{}
	// userSec := map[string][]structs.RoomUserData{}
	userInfo := []structs.GameInfoArray{}

	for _, v := range user {
		if !v.Leave {
			userSec[v.Uuid] = v.Sec
			// userSec[v.Uuid] = []structs.RoomUserData{
			// 	{Sec: v.Sec},
			// 	{Name: v.Name},
			// 	{ImgUrl: v.ImgUrl},
			// }
		}
	}

	var lst []structs.Game
	for k, v := range userSec {
		lst = append(lst, structs.Game{k, v})
	}
	sort.Slice(lst, func(i, j int) bool {
		return lst[i].Sec < lst[j].Sec // 升序
	})

	if len(lst) > 6 {
		good := lst[:3]
		bad := lst[len(lst)-3:]
		good = append(good, bad...)

		for _, v := range good {
			for _, userV := range user {
				if v.Uuid == userV.Uuid {
					item := []structs.GameInfoArray{
						{Arr: []string{userV.Name, userV.ImgUrl}},
					}
					userInfo = append(userInfo, item...)
				}
			}
		}
		return good, userInfo
	}

	for _, v := range lst {
		for _, userV := range user {
			if v.Uuid == userV.Uuid {
				// item := []string{userV.Name, userV.ImgUrl}
				item := []structs.GameInfoArray{
					{Arr: []string{userV.Name, userV.ImgUrl}},
				}
				userInfo = append(userInfo, item...)
			}
		}
	}
	return lst, userInfo
}

func CheckUserLeave(c *gin.Context, roomId, uuid string) bool {
	var room structs.RoomInfo
	filter := bson.D{{"roomId", roomId}}
	err := coll.FindOne(context.TODO(), filter).Decode(&room)
	if err != nil {
		fmt.Println(err)
	}
	user := room.User
	var b bool
	for _, v := range user {
		if v.Uuid == uuid {
			b = v.Leave
		}
	}
	return b
}

func ResetAllUserGameClickFalseData(c *gin.Context, roomId string) {
	var room structs.RoomInfo
	filter := bson.D{{"roomId", roomId}}
	err := coll.FindOne(context.TODO(), filter).Decode(&room)
	if err != nil {
		fmt.Println(err)
	}
	user := room.User

	for _, v := range user {
		if !v.Leave {
			update := bson.D{{"$set", bson.D{{"user.$[elem].gameClick", false}}}}
			arrayFiltersOpt := options.ArrayFilters{Filters: []interface{}{bson.D{{"elem.uuid", v.Uuid}}}}
			opts := options.Update().SetArrayFilters(arrayFiltersOpt)

			_, err := coll.UpdateOne(context.TODO(), filter, update, opts)
			if err != nil {
				log.Println(err)
			}
		}
	}
}

func ChangeRoomUserDataAudioOrVideo(c *gin.Context, roomId, uuid, status string, b bool) {
	filter := bson.D{{"roomId", roomId}}

	var s string
	if status == "video" {
		s = "videoStatus"
	} else {
		s = "audioStatus"
	}

	coll.FindOneAndUpdate(
		context.Background(),
		filter,
		bson.M{"$set": bson.M{fmt.Sprintf("user.$[elem].%s", s): b}},
		options.FindOneAndUpdate().SetArrayFilters(options.ArrayFilters{
			Filters: []interface{}{bson.M{"elem.uuid": uuid}},
		}),
	)
}

func ChangeRoomUserDataWaitingStatus(c *gin.Context, roomId, uuid string, audioStatus, videoStatus bool) {
	filter := bson.D{{"roomId", roomId}}

	coll.FindOneAndUpdate(
		context.Background(),
		filter,
		bson.M{"$set": bson.M{
			"user.$[elem].audioStatus": audioStatus,
			"user.$[elem].videoStatus": videoStatus,
		}},
		options.FindOneAndUpdate().SetArrayFilters(options.ArrayFilters{
			Filters: []interface{}{bson.M{"elem.uuid": uuid}},
		}),
	)
}

func ChangeRoomUserDataLeave(c *gin.Context, roomId, uuid string, leave bool) {
	filter := bson.D{{"roomId", roomId}}

	coll.FindOneAndUpdate(
		context.Background(),
		filter,
		bson.M{"$set": bson.M{"user.$[elem].leave": leave}},
		options.FindOneAndUpdate().SetArrayFilters(options.ArrayFilters{
			Filters: []interface{}{bson.M{"elem.uuid": uuid}},
		}),
	)
}
