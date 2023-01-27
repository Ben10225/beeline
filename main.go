package main

import (
	"beeline/api"
	"beeline/configs"
	"beeline/handlers"
	"beeline/utils"
	"log"

	"github.com/gin-gonic/gin"
	socketio "github.com/googollee/go-socket.io"
)

// nodemon --exec go run main.go --signal SIGTERM

const portNumber = ":3000"

// router := gin.Default()

// router.LoadHTMLGlob("templates/*")
// router.Static("/public", "./public")

func main() {
	router := gin.New()

	configs.ConnectDB()

	// routes.UserRoute(router)

	server := socketio.NewServer(nil)
	server.OnConnect("/", func(s socketio.Conn) error {
		s.SetContext("")
		log.Println("connected:", s.ID())
		return nil
	})

	// server.OnEvent("/", "notice", func(s socketio.Conn, msg string) {
	// 	log.Println("notice:", msg)
	// 	s.Emit("reply", "have "+msg)
	// })

	server.OnEvent("/", "join-room", func(s socketio.Conn, roomId, userId string) {
		// s.SetContext(roomId)
		// log.Println("get:", roomId, userId)

		s.Join(roomId)
		// fmt.Println(userId)
		server.BroadcastToRoom("/", roomId, "user-connected", userId)
		// s.Emit("user-connected", userId)

		server.OnEvent("/", "stop-camera", func(s socketio.Conn, userId string) {
			s.Emit("close-camera-view", userId)
		})

		server.OnEvent("/", "open-camera", func(s socketio.Conn, userId string) {
			s.Emit("open-camera-view", userId)
		})

		server.OnDisconnect("/", func(s socketio.Conn, msg string) {
			s.Emit("user-disconnected", userId)
			server.BroadcastToRoom("/", roomId, "user-disconnected", userId)
			log.Println("closed", msg)
		})

		// s.Leave()

		// return roomId
		// s.Emit("reply", "have "+msg)
	})

	go func() {
		if err := server.Serve(); err != nil {
			log.Fatalf("socketio listen error: %s\n", err)
		}
	}()
	defer server.Close()

	router.Use(utils.GinMiddleware("http://localhost:4000"))
	// router.Use(gin.Recovery())
	router.GET("/socket.io/*any", gin.WrapH(server))
	router.POST("/socket.io/*any", gin.WrapH(server))

	router.LoadHTMLGlob("templates/*")
	router.Static("/public", "./public")

	router.GET("/", handlers.Index)
	router.GET("/:room", handlers.Room)

	router.GET("/api/auth", api.Auth)
	router.POST("/api/signup", api.Signup)
	router.POST("/api/signin", api.Signin)
	router.GET("/api/signout", api.Signout)

	router.Run(portNumber)
}
