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

	uuidMap := map[string]string{}
	roomMap := map[string]string{}

	server.OnEvent("/", "join-room", func(s socketio.Conn, roomId, uuid string) {
		// s.SetContext(roomId)
		log.Println(uuid, "join room")
		s.Join(roomId)
		uuidMap[s.ID()] = uuid
		roomMap[uuid] = roomId
		server.BroadcastToRoom("/", roomId, "user-connected", uuid)
		// s.Emit("user-connected", uuid)
	})

	server.OnEvent("/enter", "join-room", func(s socketio.Conn, roomId, uuid string) {
		// s.SetContext(roomId)
		log.Println(uuid, "s2 join room")
		s.Join(roomId)
		uuidMap[s.ID()] = uuid
		roomMap[uuid] = roomId
		server.BroadcastToRoom("/enter", roomId, "user-connected", uuid)
		// s.Emit("user-connected", uuid)
	})

	server.OnDisconnect("", func(s socketio.Conn, msg string) {
		// s.Emit("user-disconnected", uuid)
		roomId := roomMap[uuidMap[s.ID()]]
		server.BroadcastToRoom("/", roomId, "user-disconnected", uuidMap[s.ID()])
		log.Println("disconnect", s.ID(), roomId)
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
	server.OnEvent("/enter", "send-enter-request", func(s socketio.Conn, roomId, clientUuid, clientName, clientImg string) {
		server.BroadcastToRoom("/enter", roomId, "sent-to-auth", clientUuid, clientName, clientImg)
	})

	server.OnEvent("/enter", "allow-refuse-room", func(s socketio.Conn, roomId, clientName string, b bool) {
		server.BroadcastToRoom("/enter", roomId, "client-action", roomId, clientName, b)
		// server.BroadcastToNamespace("/", "client-action", roomId, clientName, b)
	})

	// chat
	server.OnEvent("/", "chat", func(s socketio.Conn, roomId, clientName, message string) {
		current := utils.GetCurrentTime()
		server.BroadcastToRoom("/", roomId, "chat-room", roomId, clientName, current, message)
	})

	// close chat
	server.OnEvent("/", "close-chat", func(s socketio.Conn, roomId string, b bool) {
		server.BroadcastToRoom("/", roomId, "close-open-chat", roomId, b)
	})

	// auth change
	server.OnEvent("/", "auth-change", func(s socketio.Conn, roomId, oldUuid, newUuid string) {
		server.BroadcastToRoom("/", roomId, "auth-change-set", roomId, oldUuid, newUuid)
	})

	// close screen
	server.OnEvent("/", "close-screen", func(s socketio.Conn, roomId, uuid string) {
		server.BroadcastToRoom("/", roomId, "close-screen-set", roomId, uuid)
	})

	// audio ani
	server.OnEvent("/", "audio-ani", func(s socketio.Conn, roomId, uuid string, b bool) {
		server.BroadcastToRoom("/", roomId, "audio-ani-set", roomId, uuid, b)
	})

	// start game
	server.OnEvent("/", "start-game", func(s socketio.Conn, roomId string) {
		value := utils.GenerateGameValue()
		server.BroadcastToRoom("/", roomId, "give-game-value", roomId, value)
	})

	// 5 sec end game
	server.OnEvent("/", "five-sec-end-game", func(s socketio.Conn, roomId string) {
		server.BroadcastToRoom("/", roomId, "five-end", roomId)
	})

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
