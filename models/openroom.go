package models

import (
	"beeline/configs"
	"beeline/structs"
	"context"
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

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
	var roomCollection *mongo.Collection = configs.GetCollection(configs.DB, "rooms")

	var room structs.RoomData
	cur := roomCollection.FindOne(c, bson.M{
		"roomId": roomId,
	})
	err := cur.Decode(&room)
	if err == nil {
		return true
	}

	newRoom := gin.H{
		"roomId": roomId,
	}

	roomCollection.InsertOne(c, newRoom)
	return false
}