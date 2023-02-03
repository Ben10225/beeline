package main

import (
	"beeline/configs"
	"beeline/routers"
	"beeline/utils"
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	socketio "github.com/googollee/go-socket.io"
)

// nodemon --exec go run main.go --signal SIGTERM

const portNumber = ":3000"

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

	server.OnEvent("/", "join-room", func(s socketio.Conn, roomId, uuid string) {
		// s.SetContext(roomId)

		s.Join(roomId)
		// fmt.Println(uuid)
		server.BroadcastToRoom("/", roomId, "user-connected", uuid)
		// s.Emit("user-connected", uuid)

		server.OnDisconnect("", func(s socketio.Conn, msg string) {
			// s.Emit("user-disconnected", uuid)
			server.BroadcastToRoom("/", roomId, "user-disconnected", uuid)
			log.Println("disconnect", s.ID())
		})
	})

	// video & audio
	server.OnEvent("/", "set-option", func(s socketio.Conn, roomId, options, uuid string, b bool) {
		server.BroadcastToRoom("/", roomId, "set-view", options, uuid, b)
	})

	// leave room
	server.OnEvent("/", "leave-room", func(s socketio.Conn, roomId, uuid string) {
		s.Leave(roomId)
		server.BroadcastToRoom("/", roomId, "leave-video-remove", uuid)
		s.Close()
	})

	// enter room
	server.OnEvent("/", "send-enter-request", func(s socketio.Conn, roomId, clientUuid, clientName, clientImg string) {
		server.BroadcastToRoom("/", roomId, "sent-to-auth", clientUuid, clientName, clientImg)
	})

	server.OnEvent("/", "allow-refuse-room", func(s socketio.Conn, roomId, clientName string, b bool) {
		// server.BroadcastToRoom("/", roomId, "client-action", clientName, b)
		server.BroadcastToNamespace("/", "client-action", roomId, clientName, b)
		// s.Emit("client-action", clientName, b)
	})

	// reconnect
	// server.OnEvent("/", "reconnect", func(s socketio.Conn, roomId, uuid string) {
	// 	server.BroadcastToRoom("/", roomId, "user-reconnect", uuid)
	// })

	server.OnError("/", func(s socketio.Conn, e error) {
		fmt.Println("meet error:", e)
	})

	go server.Serve()
	defer server.Close()

	r.Use(utils.GinMiddleware("http://localhost:4000"))
	// router.Use(gin.Recovery())

	r.GET("/socket.io/*any", gin.WrapH(server))
	r.POST("/socket.io/*any", gin.WrapH(server))

	r.LoadHTMLGlob("templates/*")
	r.Static("/public", "./public")

	routers.Routers(r)

	r.Run(portNumber)
}
