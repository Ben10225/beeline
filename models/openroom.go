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

func InsertUserToRoom(c *gin.Context, roomId, uuid string, audio, video, auth bool) bool {
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
				{"audioStatus", audio},
				{"videoStatus", video},
				{"auth", auth},
				{"leave", leaveStatus},
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

func AssignNewAuthFunc(c *gin.Context, roomId, oldUuid, newUuid string) string {
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

func SendSec(c *gin.Context, roomId, uuid string, sec float64) {
	filter := bson.D{{"roomId", roomId}}
	coll.FindOneAndUpdate(
		context.Background(),
		filter,
		bson.M{"$set": bson.M{"user.$[elem].sec": sec}},
		options.FindOneAndUpdate().SetArrayFilters(options.ArrayFilters{
			Filters: []interface{}{bson.M{"elem.uuid": uuid}},
		}),
	)
}

func GetGameSlice(c *gin.Context, roomId string) []structs.Game {
	var room structs.RoomInfo
	filter := bson.D{{"roomId", roomId}}
	err := coll.FindOne(context.TODO(), filter).Decode(&room)
	if err != nil {
		fmt.Println(err)
	}
	user := room.User
	userSec := map[string]float64{}

	for _, v := range user {
		if !v.Leave {
			userSec[v.Uuid] = v.Sec
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
		return good
	}

	return lst
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

/*
func InsertUserToRoom(c *gin.Context, roomId, uuid string, audio, video bool) bool {

	var roomCollection *mongo.Collection = configs.GetCollection(configs.DB, roomId)

	var user []*structs.RoomData
	filter := bson.D{{"uuid", uuid}}
	cursor, err := roomCollection.Find(context.TODO(), filter)

	if err != nil {
		fmt.Println(err)
		return false
	}

	cursor.All(context.TODO(), &user)
	if err != nil {
		fmt.Println(err)
		return false
	}
	if len(user) > 0 {
		return false
	}

	newData := gin.H{
		"uuid":        uuid,
		"audioStatus": audio,
		"videoStatus": video,
	}

	roomCollection.InsertOne(c, newData)
	return true

}

func DeleteUserToRoom(c *gin.Context, roomId, uuid string) bool {
	var roomCollection *mongo.Collection = configs.GetCollection(configs.DB, roomId)
	_, err := roomCollection.DeleteOne(c, bson.M{"uuid": uuid})
	if err != nil {
		fmt.Println(err)
		return false
	}

	var roomDatas []structs.RoomData
	filter := bson.D{{}}
	cursor, err := roomCollection.Find(context.TODO(), filter)
	if err != nil {
		log.Println(err)
		return false
	}

	cursor.All(context.TODO(), &roomDatas)
	if err != nil {
		log.Fatal(err)
	}
	// for _, result := range roomDatas {
	// 	fmt.Printf("%+v\n", result)
	// }

	if len(roomDatas) == 0 {
		roomCollection.Drop(c)
		var collection *mongo.Collection = configs.GetCollection(configs.DB, "rooms")
		_, err := collection.DeleteOne(c, bson.M{"roomId": roomId})
		if err != nil {
			log.Println(err)
		}
	}
	return true
}

func GetUserInRoom(c *gin.Context, roomId, uuid string) bool {
	var roomCollection *mongo.Collection = configs.GetCollection(configs.DB, roomId)
	var userInRoom structs.RoomData
	cur := roomCollection.FindOne(c, bson.M{
		"uuid": uuid,
	})
	err := cur.Decode(&userInRoom)
	if err != nil {
		fmt.Println(err)
		return false
	}
	return true
}

func CheckOrInsertRoom(c *gin.Context, roomId string) bool {
	var coll *mongo.Collection = configs.GetCollection(configs.DB, "rooms")

	var result structs.DataInfo
	filter := bson.D{{"roomid", roomId}}
	err := coll.FindOne(context.TODO(), filter).Decode(&result)
	if err == nil {
		return true
	}
	return false
}

func SetStreamStatus(c *gin.Context, roomId, uuid, status string, b bool) {
	// if both {
	// 	filter := bson.D{{"uuid", uuid}}
	// 	update := bson.D{{"$set", bson.D{{"videostatus", false}, {"audiostatus", false}}}}
	// 	_, err := userCollection.UpdateOne(context.TODO(), filter, update)
	// 	if err != nil {
	// 		log.Fatal(err)
	// 	}
	// 	return
	// }

	var roomCollection *mongo.Collection = configs.GetCollection(configs.DB, roomId)
	var s string
	if status == "video" {
		s = "videoStatus"
	} else {
		s = "audioStatus"
	}

	filter := bson.D{{"uuid", uuid}}
	update := bson.D{{"$set", bson.D{{s, b}}}}
	_, err := roomCollection.UpdateOne(context.TODO(), filter, update)
	if err != nil {
		log.Fatal(err)
	}
}

*/
