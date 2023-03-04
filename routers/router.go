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
		user.PATCH("/photo", api.UploadImg)

		// user.POST("/getremoteuser", api.GetRemoteUser)

		// /room/:roomid/user/:id

		// /room/:roomid?uuid
		// /room/:roomid/user
	}

	room := router.Group("/room")
	{
		room.GET("/:roomId", api.GetRoomExist)

		room.GET("/:roomId/user/:id", api.GetRemoteUser)
		room.POST("/:roomId/user/:id", api.InsertUserRoomData)
		room.PATCH("/:roomId/user/:id", api.UpdateRoomUserData)

		room.GET("/:roomId/users", api.GetRoomUsers)
		room.GET("/:roomId/auth", api.GetAuth)
		room.GET("/:roomId/chatAndShare", api.GetRoomChatAndShare)
		room.GET("/:roomId/token", api.GetEnterToken)

		room.PATCH("/:roomId/screen", api.UpdateScreenShareBool)
		room.PATCH("/:roomId/auth", api.UpdateNewAuthAndOldAuth)
		room.PATCH("/:roomId/chat", api.UpdateRoomChatStatus)

		// room.PATCH("/:roomId/user/:id", api.SetUserStreamStatus)

		// room.POST("/setusertoroom", api.SetUserRoomData)
		// room.POST("/setLeaveTrueOrDeleteRoom", api.SetUserLeaveTrue)
		// room.POST("/deleteUserArray", api.RefuseUserInRoom)
		// room.POST("/checkneedreconnect", api.CheckUserStillInRoom)
		// room.POST("/checkroomexist", api.CheckRoomExist)
		// room.POST("/streamstatus", api.SetUserStreamStatus)
		// room.POST("/entertoken", api.SetEnterToken)
		// room.POST("/checkAuth", api.CheckAuth)
		// room.POST("/setLeaveFalse", api.SetUserLeaveFalse)
		// room.POST("/checkAuthChange", api.GetUserAuth)
		// room.POST("/roomChatStatus", api.RoomChatStatus)
		// room.POST("/getRoomChatAndShare", api.GetRoomChatAndShare)
		// room.POST("/getGroupInfo", api.GetGroupInfo)
		// room.POST("/setWaitingStatus", api.SetWaitingStatus)

		// room.POST("/assignNewAuth", api.AssignNewAuth)
		// room.POST("/setScreenShareBool", api.SetScreenShareBool)
		// room.POST("/sendUserSecToDB", api.SendUserSec)
		// room.POST("/getGameResult", api.GetGameResult)
		// room.POST("/checkUserLeaveFalse", api.CheckUserLeaveFalse)
		// room.POST("/resetAllUserGameClickFalse", api.ResetAllUserGameClickFalse)
	}

	leave := router.Group("/leave")
	{
		leave.PATCH("/:roomId/user/:id", api.SetUserLeaveTrue)
		leave.DELETE("/:roomId/user/:id", api.RefuseUserInRoom)
	}

	chat := router.Group("/chat")
	{
		chat.GET("/:roomId/user/:id", api.GetNewAuthAndChatStatus)
	}

	game := router.Group("/game")
	{
		game.GET("/:roomId", api.GetGameResult)
		game.PATCH("/:roomId", api.ResetAllUserGameClickFalse)
	}
}
