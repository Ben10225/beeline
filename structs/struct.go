package structs

import (
	"github.com/golang-jwt/jwt/v4"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type MyClaims struct {
	Uuid   string `json:"uuid"`
	Name   string `json:"name"`
	ImgUrl string `json:"imgUrl"`
	jwt.RegisteredClaims
}

type SignData struct {
	Name     string
	Email    string
	Password string
}

type UserResponse struct {
	Status  int                    `json:"status"`
	Message string                 `json:"message"`
	Data    map[string]interface{} `json:"data"`
}

type User struct {
	Id          primitive.ObjectID `json:"id,omitempty"`
	Uuid        string             `json:"uuid,omitempty" validate:"required"`
	PeerId      string             `json:"peerid,omitempty"`
	Name        string             `json:"name,omitempty" validate:"required"`
	Email       string             `json:"email,omitempty" validate:"required"`
	Password    string             `json:"password,omitempty" validate:"required"`
	ImgUrl      string             `json:"imgurl,omitempty"`
	VideoStatus bool               `json:"videostatus,omitempty"`
	AudioStatus bool               `json:"audiostatus,omitempty"`
}

type ImageUpload struct {
	ImgData  string
	FileName string
}

type RoomData struct {
	RoomId      string
	Uuid        string
	AudioStatus bool
	VideoStatus bool
}
