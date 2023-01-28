package main

import (
	"beeline/configs"
	"beeline/routers"
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
	r := gin.New()
	// r := gin.Default()

	configs.ConnectDB()

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

		s.Join(roomId)
		// fmt.Println(userId)
		server.BroadcastToRoom("/", roomId, "user-connected", userId)
		// s.Emit("user-connected", userId)

		server.OnEvent("/", "stop-camera", func(s socketio.Conn, peerId string) {
			server.BroadcastToRoom("/", roomId, "close-camera-view", peerId)
		})

		server.OnEvent("/", "open-camera", func(s socketio.Conn, peerId string) {
			server.BroadcastToRoom("/", roomId, "open-camera-view", peerId)
		})

		server.OnEvent("/", "leave-room", func(s socketio.Conn, peerId string) {
			server.BroadcastToRoom("/", roomId, "leave-video-remove", peerId)
		})

		server.OnDisconnect("/", func(s socketio.Conn, msg string) {
			s.Emit("user-disconnected", userId)
			server.BroadcastToRoom("/", roomId, "user-disconnected", userId)
			server.BroadcastToRoom("/", roomId, "leave-video-remove", userId)
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

	// r.Use(utils.GinMiddleware("http://localhost:4000"))
	// router.Use(gin.Recovery())

	r.GET("/socket.io/*any", gin.WrapH(server))
	r.POST("/socket.io/*any", gin.WrapH(server))

	r.LoadHTMLGlob("templates/*")
	r.Static("/public", "./public")

	routers.Routers(r)

	r.Run(portNumber)
}
