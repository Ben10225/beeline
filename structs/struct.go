package structs

import (
	"github.com/golang-jwt/jwt/v4"
)

type MyClaims struct {
	Uuid   string `json:"uuid"`
	Name   string `json:"name"`
	ImgUrl string `json:"imgUrl"`
	RoomId string `json:"roomId"`
	Client bool   `json:"client"`
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
	// Id       primitive.ObjectID `json:"id,omitempty"`
	Uuid        string `json:"uuid,omitempty" validate:"required"`
	Name        string `json:"name,omitempty" validate:"required"`
	Email       string `json:"email,omitempty" validate:"required"`
	Password    string `json:"password,omitempty" validate:"required"`
	ImgUrl      string `json:"imgurl,omitempty"`
	CreatedTime string `json:"createdtime,omitempty"`
}

type ImageUpload struct {
	ImgData  string
	FileName string
}

type RoomUserData struct {
	RoomId      string
	Uuid        string
	AudioStatus bool
	VideoStatus bool
	Auth        bool
	Leave       bool
	Sec         float64
}

type RoomInfo struct {
	RoomId      string
	ChatOpen    bool
	User        []RoomUserData
	ScreenShare bool
	RoomCreated string
}

type Game struct {
	Uuid string
	Sec  float64
}
