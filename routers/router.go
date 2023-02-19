package routers

import (
	"beeline/api"
	"beeline/handlers"

	"github.com/gin-gonic/gin"
)

func Routers(router *gin.Engine) {
	handler := router.Group("")
	{
		handler.GET("/", handlers.Index)
		handler.GET("/:room", handlers.Room)
	}

	user := router.Group("/api")
	{
		user.GET("/auth", api.Auth)
		user.POST("/signup", api.Signup)
		user.POST("/signin", api.Signin)
		user.GET("/signout", api.Signout)
		user.POST("/getremoteuser", api.GetRemoteUser)
		user.POST("/uploadimg", api.UploadImg)
	}

	room := router.Group("/room")
	{
		room.POST("/setusertoroom", api.SetUserRoomData)
		room.POST("/setLeaveTrueOrDeleteRoom", api.SetUserLeaveTrue)
		room.POST("/deleteUserArray", api.RefuseUserInRoom)
		room.POST("/checkneedreconnect", api.CheckUserStillInRoom)
		room.POST("/checkroomexist", api.CheckRoomExist)
		room.POST("/streamstatus", api.SetUserStreamStatus)
		room.POST("/entertoken", api.SetEnterToken)
		room.POST("/checkAuth", api.CheckAuth)
		room.POST("/setLeaveFalse", api.SetUserLeaveFalse)
		room.POST("/checkAuthChange", api.GetUserAuth)
		room.POST("/roomChatStatus", api.RoomChatStatus)
		room.POST("/getRoomChatAndShare", api.GetRoomChatAndShare)
		room.POST("/getGroupInfo", api.GetGroupInfo)

		room.POST("/assignNewAuth", api.AssignNewAuth)
		room.POST("/setScreenShareBool", api.SetScreenShareBool)
		room.POST("/sendUserSecToDB", api.SendUserSec)
		room.POST("/getGameResult", api.GetGameResult)
	}
}
