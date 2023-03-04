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

	newUser := structs.User{
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
