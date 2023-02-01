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
		user.POST("/setnewuuid", api.SetNewUuid)
		// user.POST("/setpeerid", api.SetUserPeerId)
		// user.POST("/getlocalpeerid", api.GetUserPeerId)
	}

	room := router.Group("/room")
	{
		room.POST("/setusertoroom", api.SetUserRoomData)
		room.POST("/deleteuserfromroom", api.DeleteUserRoomData)
		room.POST("/checkneedreconnect", api.CheckUserStillInRoom)
		room.POST("/checkroomexist", api.CheckRoomExist)
		room.POST("/streamstatus", api.SetUserStreamStatus)
	}
}
