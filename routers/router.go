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
