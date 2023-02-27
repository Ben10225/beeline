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
	name := req.Name
	imgUrl := req.ImgUrl

	models.InsertUserToRoom(c, roomId, uuid, name, imgUrl, audioStatus, videoStatus, auth)

	c.JSON(http.StatusOK, gin.H{
		"ok": true,
	})
}

func SetUserLeaveTrue(c *gin.Context) {
	var req structs.RoomUserData
	err := c.BindJSON(&req)
	if err != nil {
		log.Fatal(err)
	}
	roomId := req.RoomId
	uuid := req.Uuid
	auth := req.Auth

	models.UserLeaveTrue(c, roomId, uuid, auth)

	c.JSON(http.StatusOK, gin.H{
		"ok": true,
	})
}

func RefuseUserInRoom(c *gin.Context) {
	var req structs.RoomUserData
	c.BindJSON(&req)
	roomId := req.RoomId
	uuid := req.Uuid

	models.PullUserData(c, roomId, uuid)
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
	result, authUuid := models.CheckAuthAlready(c, roomId)

	var msg string

	if result {
		msg = "exist"
	} else {
		msg = "not exist"
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  msg,
		"authUuid": authUuid,
	})
}

func SetUserLeaveFalse(c *gin.Context) {
	var req structs.RoomUserData
	err := c.BindJSON(&req)
	if err != nil {
		log.Fatal(err)
	}

	roomId := req.RoomId
	uuid := req.Uuid

	models.UserBackToRoomLeaveStatus(c, roomId, uuid)
	c.JSON(http.StatusOK, gin.H{
		"ok": true,
	})
}

func GetUserAuth(c *gin.Context) {
	var req structs.RoomUserData
	err := c.BindJSON(&req)
	if err != nil {
		log.Fatal(err)
	}

	roomId := req.RoomId
	uuid := req.Uuid

	newHost, chatOpen := models.GetRoomNewHost(c, roomId, uuid)
	c.JSON(http.StatusOK, gin.H{
		"newHost":  newHost,
		"chatOpen": chatOpen,
	})
}

func RoomChatStatus(c *gin.Context) {
	var req structs.RoomInfo
	c.BindJSON(&req)

	roomId := req.RoomId
	chatOpen := req.ChatOpen

	models.SetRoomChatStatus(c, roomId, chatOpen)

	c.JSON(http.StatusOK, gin.H{
		"ok": true,
	})
}

func GetRoomChatAndShare(c *gin.Context) {
	var req structs.RoomInfo
	c.BindJSON(&req)

	roomId := req.RoomId
	chatOpen, screenShare := models.GetRoomChatAndShareStatus(c, roomId)

	c.JSON(http.StatusOK, gin.H{
		"chatOpen":    chatOpen,
		"screenShare": screenShare,
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

func GetGroupInfo(c *gin.Context) {
	var req structs.RoomInfo
	c.BindJSON(&req)

	roomId := req.RoomId
	group, host := models.GetGroupInfoData(c, roomId)

	c.JSON(http.StatusOK, gin.H{
		"data": group,
		"host": host,
	})
}

func AssignNewAuth(c *gin.Context) {
	req := struct {
		RoomId  string
		OldUuid string
		NewUuid string
	}{}
	c.BindJSON(&req)

	roomId := req.RoomId
	oldUuid := req.OldUuid
	newUuid := req.NewUuid

	status := models.AssignNewAuthFunc(c, roomId, oldUuid, newUuid)
	if status == "bad request" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": true,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok": true,
	})
}

func SetScreenShareBool(c *gin.Context) {
	var req structs.RoomInfo
	c.BindJSON(&req)

	roomId := req.RoomId
	screenShare := req.ScreenShare

	models.SetScreenShare(c, roomId, screenShare)

	c.JSON(http.StatusOK, gin.H{
		"ok": true,
	})
}

func SendUserSec(c *gin.Context) {
	var req structs.RoomUserData
	c.BindJSON(&req)

	roomId := req.RoomId
	uuid := req.Uuid
	sec := req.Sec
	models.SendSec(c, roomId, uuid, sec)

	c.JSON(http.StatusOK, gin.H{
		"ok": true,
	})
}

func GetGameResult(c *gin.Context) {
	var req structs.RoomInfo
	c.BindJSON(&req)

	roomId := req.RoomId
	result, info := models.GetGameSlice(c, roomId)

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"result": result,
			"info":   info,
		},
	})
}

func CheckUserLeaveFalse(c *gin.Context) {
	var req structs.RoomUserData
	c.BindJSON(&req)

	roomId := req.RoomId
	uuid := req.Uuid

	leave := models.CheckUserLeave(c, roomId, uuid)

	c.JSON(http.StatusOK, gin.H{
		"data": leave,
	})
}

func SetWaitingStatus(c *gin.Context) {
	var req structs.RoomUserData
	c.BindJSON(&req)

	roomId := req.RoomId
	uuid := req.Uuid
	audioStatus := req.AudioStatus
	videoStatus := req.VideoStatus

	models.SetWaitingStatusData(c, roomId, uuid, audioStatus, videoStatus)

	c.JSON(http.StatusOK, gin.H{
		"ok": true,
	})
}
