package models

import (
	"beeline/configs"
	"beeline/structs"
	"fmt"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
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

func CreateUser(c *gin.Context, uuid, name, email, password string) bool {
	newUser := structs.User{
		Id:       primitive.NewObjectID(),
		Uuid:     uuid,
		Name:     name,
		Email:    email,
		Password: password,
	}

	_, err := userCollection.InsertOne(c, newUser)
	if err != nil {
		fmt.Println(err)
		return false
	}
	return true
}

func GetUser(c *gin.Context, email string) (string, string, string, bool) {
	user := structs.User{
		Email: email,
	}
	err := userCollection.FindOne(c, bson.M{"email": email}).Decode(&user)
	if err != nil {
		return "", "", "", false
	}
	return user.Uuid, user.Name, user.Password, true
}
