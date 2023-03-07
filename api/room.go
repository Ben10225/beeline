package api

import (
	"beeline/models"
	"beeline/structs"
	"beeline/utils"
	"net/http"

	"github.com/gin-gonic/gin"
)

func CreateUserRoomData(c *gin.Context) {
	roomId := c.Param("roomId")
	uuid := c.Param("id")

	var req structs.RoomUserData
	c.BindJSON(&req)

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

func UpdateUserLeaveTrue(c *gin.Context) {
	roomId := c.Param("roomId")
	uuid := c.Param("id")

	var req structs.RoomUserData
	c.BindJSON(&req)

	auth := req.Auth

	models.UserLeaveTrue(c, roomId, uuid, auth)

	c.JSON(http.StatusOK, gin.H{
		"ok": true,
	})
}

func DeleteRefuseUserArray(c *gin.Context) {
	roomId := c.Param("roomId")
	uuid := c.Param("id")

	models.PullUserData(c, roomId, uuid)
	c.JSON(http.StatusOK, gin.H{
		"ok": true,
	})
}

func GetRoomExist(c *gin.Context) {
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

func GetAuth(c *gin.Context) {
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

func GetNewAuthAndChatStatus(c *gin.Context) {
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

	roomId := c.Param("roomId")
	chatOpen := req.ChatOpen

	models.SetRoomChatStatus(c, roomId, chatOpen)

	c.JSON(http.StatusOK, gin.H{
		"ok": true,
	})
}

func GetRoomChatAndShare(c *gin.Context) {
	roomId := c.Param("roomId")
	chatOpen, screenShare := models.GetRoomChatAndShareStatus(c, roomId)

	c.JSON(http.StatusOK, gin.H{
		"chatOpen":    chatOpen,
		"screenShare": screenShare,
	})
}

func GetEnterToken(c *gin.Context) {
	roomId := c.Param("roomId")
	token, _ := utils.MakeRoomToken(roomId)
	c.SetCookie("roomT", token, 0, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{
		"ok": true,
	})
}

func GetRoomUsers(c *gin.Context) {
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

	roomId := c.Param("roomId")
	screenShare := req.ScreenShare

	models.SetScreenShare(c, roomId, screenShare)

	c.JSON(http.StatusOK, gin.H{
		"ok": true,
	})
}

func GetGameResult(c *gin.Context) {
	roomId := c.Param("roomId")
	result, info := models.GetGameSlice(c, roomId)

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"result": result,
			"info":   info,
		},
	})
}

func UpdateAllUserGameClickFalse(c *gin.Context) {
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

	if option == "audioStatus" {
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
