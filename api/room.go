package api

import (
	"beeline/models"
	"beeline/structs"
	"beeline/utils"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func SetUserRoomData(c *gin.Context) {
	var req structs.RoomUserData
	err := c.BindJSON(&req)
	if err != nil {
		log.Fatal(err)
	}
	roomId := req.RoomId
	uuid := req.Uuid
	audioStatus := req.AudioStatus
	videoStatus := req.VideoStatus
	auth := req.Auth

	models.InsertUserToRoom(c, roomId, uuid, audioStatus, videoStatus, auth)

	c.JSON(http.StatusOK, gin.H{
		"ok": true,
	})
}

func DeleteUserRoomData(c *gin.Context) {
	var req structs.RoomUserData
	err := c.BindJSON(&req)
	if err != nil {
		log.Fatal(err)
	}
	roomId := req.RoomId
	uuid := req.Uuid

	models.DeleteUserToRoom(c, roomId, uuid)

	c.JSON(http.StatusOK, gin.H{
		"ok": true,
	})
}

func CheckUserStillInRoom(c *gin.Context) {
	var req structs.RoomUserData
	err := c.BindJSON(&req)
	if err != nil {
		log.Fatal(err)
	}
	roomId := req.RoomId
	uuid := req.Uuid

	needReconnect := models.GetUserInRoom(c, roomId, uuid)
	if needReconnect {
		c.JSON(http.StatusOK, gin.H{
			"message": "needReconnect",
		})
	} else {
		c.JSON(http.StatusOK, gin.H{
			"message": "userLeft",
		})
	}
}

func CheckRoomExist(c *gin.Context) {
	var req structs.RoomUserData
	err := c.BindJSON(&req)
	if err != nil {
		log.Fatal(err)
	}
	roomId := req.RoomId

	exist := models.FindRoom(c, roomId)

	if exist {
		c.JSON(http.StatusOK, gin.H{
			"exist": true,
		})
	} else {
		c.JSON(http.StatusOK, gin.H{
			"exist": false,
		})
	}
}

func SetUserStreamStatus(c *gin.Context) {
	req := struct {
		RoomId string
		Uuid   string
		Status string
		B      bool
	}{}
	err := c.BindJSON(&req)
	if err != nil {
		log.Fatal(err)
	}

	roomId := req.RoomId
	uuid := req.Uuid
	status := req.Status
	b := req.B

	models.SetStreamStatus(c, roomId, uuid, status, b)
	c.JSON(http.StatusOK, gin.H{
		"ok": true,
	})
}

func CheckAuth(c *gin.Context) {
	var req structs.RoomUserData
	err := c.BindJSON(&req)
	if err != nil {
		log.Fatal(err)
	}

	roomId := req.RoomId
	result := models.CheckAuthAlready(c, roomId)

	var msg string

	if result {
		msg = "exist"
	} else {
		msg = "not exist"
	}

	c.JSON(http.StatusOK, gin.H{
		"message": msg,
	})
}

func SetEnterToken(c *gin.Context) {
	var req structs.RoomUserData
	err := c.BindJSON(&req)
	if err != nil {
		log.Fatal(err)
	}

	roomId := req.RoomId

	token, _ := utils.MakeRoomToken(roomId)
	c.SetCookie("roomT", token, 0, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{
		"ok": true,
	})
}
