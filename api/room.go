package api

import (
	"beeline/models"
	"beeline/structs"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func SetUserRoomData(c *gin.Context) {
	var req structs.RoomData
	err := c.BindJSON(&req)
	if err != nil {
		log.Fatal(err)
	}
	roomId := req.RoomId
	uuid := req.Uuid
	audioStatus := req.AudioStatus
	videoStatus := req.VideoStatus

	models.InsertUserToRoom(c, roomId, uuid, audioStatus, videoStatus)

	c.JSON(http.StatusOK, gin.H{
		"ok": true,
	})
}

func DeleteUserRoomData(c *gin.Context) {
	var req structs.RoomData
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
	var req structs.RoomData
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
	var req structs.RoomData
	err := c.BindJSON(&req)
	if err != nil {
		log.Fatal(err)
	}
	roomId := req.RoomId

	exist := models.CheckOrInsertRoom(c, roomId)

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
