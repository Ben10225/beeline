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

var userCollection *mongo.Collection = configs.GetCollection(configs.DB, "users")

func CheckEmailExist(c *gin.Context, email string) bool {
	user := structs.User{
		Email: email,
	}

	err := userCollection.FindOne(c, bson.M{"email": email}).Decode(&user)

	return err == nil
}

func CreateUser(c *gin.Context, uuid, name, email, password, color string) bool {
	newUser := structs.User{
		// Id:       primitive.NewObjectID(),
		Uuid:     uuid,
		Name:     name,
		Email:    email,
		Password: password,
		ImgUrl:   color,
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
	filter := bson.D{{"uuid", uuid}}
	update := bson.D{{"$set", bson.D{{"imgurl", imgUrl}}}}
	_, err := userCollection.UpdateOne(context.TODO(), filter, update)
	if err != nil {
		log.Fatal(err)
	}
}

func UpdateUserUuid(c *gin.Context, oldUuid, newUuid string) {
	filter := bson.D{{"uuid", oldUuid}}
	update := bson.D{{"$set", bson.D{{"uuid", newUuid}}}}
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
*/
