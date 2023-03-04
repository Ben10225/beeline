package api

import (
	"beeline/models"
	"beeline/structs"
	"beeline/utils"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func InsertUserRoomData(c *gin.Context) {
	roomId := c.Param("roomId")
	uuid := c.Param("id")

	var req structs.RoomUserData
	err := c.BindJSON(&req)
	if err != nil {
		log.Fatal(err)
	}
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
	roomId := c.Param("roomId")
	uuid := c.Param("id")

	var req structs.RoomUserData
	err := c.BindJSON(&req)
	if err != nil {
		log.Fatal(err)
	}
	// roomId := req.RoomId
	// uuid := req.Uuid
	auth := req.Auth

	models.UserLeaveTrue(c, roomId, uuid, auth)

	c.JSON(http.StatusOK, gin.H{
		"ok": true,
	})
}

func RefuseUserInRoom(c *gin.Context) {
	// var req structs.RoomUserData
	// c.BindJSON(&req)
	// roomId := req.RoomId
	// uuid := req.Uuid
	roomId := c.Param("roomId")
	uuid := c.Param("id")

	models.PullUserData(c, roomId, uuid)
	c.JSON(http.StatusOK, gin.H{
		"ok": true,
	})
}

/*
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
*/

func GetRoomExist(c *gin.Context) {
	// var req structs.RoomUserData
	// err := c.BindJSON(&req)
	// if err != nil {
	// 	log.Fatal(err)
	// }
	// roomId := req.RoomId
	roomId := c.Param("roomId")
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

func GetAuth(c *gin.Context) {
	// var req structs.RoomUserData
	// err := c.BindJSON(&req)
	// if err != nil {
	// 	log.Fatal(err)
	// }

	// roomId := req.RoomId
	roomId := c.Param("roomId")
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

func GetNewAuthAndChatStatus(c *gin.Context) {
	// var req structs.RoomUserData
	// err := c.BindJSON(&req)
	// if err != nil {
	// 	log.Fatal(err)
	// }

	roomId := c.Param("roomId")
	uuid := c.Param("id")

	newHost, chatOpen := models.GetRoomNewHost(c, roomId, uuid)
	c.JSON(http.StatusOK, gin.H{
		"newHost":  newHost,
		"chatOpen": chatOpen,
	})
}

func UpdateRoomChatStatus(c *gin.Context) {
	var req structs.RoomInfo
	c.BindJSON(&req)

	// roomId := req.RoomId
	roomId := c.Param("roomId")
	chatOpen := req.ChatOpen

	models.SetRoomChatStatus(c, roomId, chatOpen)

	c.JSON(http.StatusOK, gin.H{
		"ok": true,
	})
}

func GetRoomChatAndShare(c *gin.Context) {
	// var req structs.RoomInfo
	// c.BindJSON(&req)

	// roomId := req.RoomId
	roomId := c.Param("roomId")
	chatOpen, screenShare := models.GetRoomChatAndShareStatus(c, roomId)

	c.JSON(http.StatusOK, gin.H{
		"chatOpen":    chatOpen,
		"screenShare": screenShare,
	})
}

func GetEnterToken(c *gin.Context) {
	// var req structs.RoomUserData
	// err := c.BindJSON(&req)
	// if err != nil {
	// 	log.Fatal(err)
	// }

	// roomId := req.RoomId
	roomId := c.Param("roomId")
	token, _ := utils.MakeRoomToken(roomId)
	c.SetCookie("roomT", token, 0, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{
		"ok": true,
	})
}

// func GetGroupInfo(c *gin.Context) {
func GetRoomUsers(c *gin.Context) {
	// var req structs.RoomInfo
	// c.BindJSON(&req)

	// roomId := req.RoomId
	roomId := c.Param("roomId")
	group, host := models.GetGroupInfoData(c, roomId)

	c.JSON(http.StatusOK, gin.H{
		"data": group,
		"host": host,
	})
}

func UpdateNewAuthAndOldAuth(c *gin.Context) {
	req := struct {
		OldUuid string
		NewUuid string
	}{}
	c.BindJSON(&req)

	// roomId := req.RoomId
	roomId := c.Param("roomId")
	oldUuid := req.OldUuid
	newUuid := req.NewUuid

	status := models.AssignNewAuth(c, roomId, oldUuid, newUuid)
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

func UpdateScreenShareBool(c *gin.Context) {
	var req structs.RoomInfo
	c.BindJSON(&req)

	// roomId := req.RoomId
	roomId := c.Param("roomId")
	screenShare := req.ScreenShare

	models.SetScreenShare(c, roomId, screenShare)

	c.JSON(http.StatusOK, gin.H{
		"ok": true,
	})
}

/*
func SendUserSec(c *gin.Context) {
	var req structs.RoomUserData
	c.BindJSON(&req)

	roomId := req.RoomId
	uuid := req.Uuid
	sec := req.Sec
	gameClick := req.GameClick
	canQuitGame := models.SendSec(c, roomId, uuid, sec, gameClick)

	c.JSON(http.StatusOK, gin.H{
		"data": canQuitGame,
	})
}
*/

func GetGameResult(c *gin.Context) {
	// var req structs.RoomInfo
	// c.BindJSON(&req)
	// roomId := req.RoomId

	roomId := c.Param("roomId")
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

/*
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
*/

func ResetAllUserGameClickFalse(c *gin.Context) {
	// var req structs.RoomUserData
	// c.BindJSON(&req)

	// roomId := req.RoomId
	roomId := c.Param("roomId")
	models.ResetAllUserGameClickFalseData(c, roomId)

	c.JSON(http.StatusOK, gin.H{
		"ok": true,
	})
}

func UpdateRoomUserData(c *gin.Context) {
	roomId := c.Param("roomId")
	uuid := c.Param("id")

	req := struct {
		Option       string
		VideoOrAudio bool
		Leave        bool
		BothAudio    bool
		BothVideo    bool
		Sec          float64
		GameClick    bool
	}{}
	c.BindJSON(&req)

	option := req.Option
	videoOrAudio := req.VideoOrAudio
	leave := req.Leave
	bothA := req.BothAudio
	bothV := req.BothVideo
	sec := req.Sec
	gameClick := req.GameClick

	if option == "auth" {

	} else if option == "audioStatus" {
		models.ChangeRoomUserDataAudioOrVideo(c, roomId, uuid, "audio", videoOrAudio)

	} else if option == "videoStatus" {
		models.ChangeRoomUserDataAudioOrVideo(c, roomId, uuid, "video", videoOrAudio)

	} else if option == "leave" {
		models.ChangeRoomUserDataLeave(c, roomId, uuid, leave)

	} else if option == "bothStatus" {
		models.ChangeRoomUserDataWaitingStatus(c, roomId, uuid, bothA, bothV)

	} else if option == "game" {
		canQuitGame := models.ChangeRoomUserDataGameSetting(c, roomId, uuid, sec, gameClick)
		c.JSON(http.StatusOK, gin.H{
			"data": canQuitGame,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok": true,
	})
}
