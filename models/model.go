package models

import (
	"beeline/configs"
	"beeline/structs"
	"context"
	"fmt"
	"log"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

var userCollection *mongo.Collection = configs.GetCollection(configs.DB, "users")

func CheckEmailExist(c *gin.Context, email string) bool {
	user := structs.User{
		Email: email,
	}

	err := userCollection.FindOne(c, bson.M{"email": email}).Decode(&user)

	return err == nil
}

func CreateUser(c *gin.Context, uuid, name, email, password, color string) bool {
	var tpZone = time.FixedZone("GMT", 8*3600)
	// fmt.Println(time.Now().In(tpZone).Format("01-02-2006 15:04:05"))

	newUser := structs.User{
		// Id:       primitive.NewObjectID(),
		Uuid:        uuid,
		Name:        name,
		Email:       email,
		Password:    password,
		ImgUrl:      color,
		CreatedTime: time.Now().In(tpZone).Format("2006-01-02 15:04:05"),
	}

	_, err := userCollection.InsertOne(c, newUser)
	if err != nil {
		fmt.Println(err)
		return false
	}
	return true
}

func GetUser(c *gin.Context, email string) (*structs.User, bool) {
	user := structs.User{
		Email: email,
	}
	err := userCollection.FindOne(c, bson.M{"email": email}).Decode(&user)
	if err != nil {
		return nil, false
	}
	return &user, true
}

func GetUserByUuid(c *gin.Context, uuid string) *structs.User {
	var user structs.User
	err := userCollection.FindOne(c, bson.M{"uuid": uuid}).Decode(&user)
	if err != nil {
		return nil
	}
	return &user
}

func UpdateUserImg(c *gin.Context, uuid, imgUrl string) {
	filter := bson.D{{Key: "uuid", Value: uuid}}
	update := bson.D{{Key: "$set", Value: bson.D{{Key: "imgurl", Value: imgUrl}}}}
	_, err := userCollection.UpdateOne(context.TODO(), filter, update)
	if err != nil {
		log.Fatal(err)
	}
}

/*
func SetPeerIdByUuid(c *gin.Context, uuid, peerId string) {
	// update := structs.User{
	// 	PeerId: peerId,
	// }
	filter := bson.D{{"uuid", uuid}}
	update := bson.D{{"$set", bson.D{{"peerid", peerId}}}}
	_, err := userCollection.UpdateOne(context.TODO(), filter, update)
	// _, err := userCollection.UpdateOne(c, bson.M{"uuid": uuid}, bson.M{"$set": update})
	if err != nil {
		log.Fatal(err)
		return
	}
}

func GetPeerIdByUuidAndRemove(c *gin.Context, uuid string) *structs.User {
	user := structs.User{}
	err := userCollection.FindOne(c, bson.M{"uuid": uuid}).Decode(&user)
	if err != nil {
		log.Fatal("find one", err)
		return nil
	}
	filter := bson.D{{"uuid", uuid}}
	update := bson.D{{"$set", bson.D{{"peerid", ""}}}}
	_, err = userCollection.UpdateOne(c, filter, update)
	if err != nil {
		log.Fatal("update none", err)
		return nil
	}
	return &user
}

func UpdateUserUuid(c *gin.Context, oldUuid, newUuid string) {
	filter := bson.D{{Key: "uuid", Value: oldUuid}}
	update := bson.D{{Key: "$set", Value: bson.D{{Key: "uuid", Value: newUuid}}}}
	_, err := userCollection.UpdateOne(context.TODO(), filter, update)
	if err != nil {
		log.Fatal(err)
	}
}
*/
