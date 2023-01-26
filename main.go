package main

import (
	"beeline/handlers"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	socketio "github.com/googollee/go-socket.io"
)

// nodemon --exec go run main.go --signal SIGTERM

// const portNumber = ":3000"

// router := gin.Default()

// router.LoadHTMLGlob("templates/*")
// router.Static("/public", "./public")

// router.GET("/", handlers.Index)
// router.Run(portNumber)

func GinMiddleware(allowOrigin string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", allowOrigin)
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, Content-Length, X-CSRF-Token, Token, session, Origin, Host, Connection, Accept-Encoding, Accept-Language, X-Requested-With")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Request.Header.Del("Origin")
		c.Next()
	}
}

func main() {
	router := gin.New()
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

		// s.Leave()

		// return roomId
		// s.Emit("reply", "have "+msg)
	})

	server.OnDisconnect("/", func(s socketio.Conn, msg string) {
		log.Println("closed", msg)
	})

	go func() {
		if err := server.Serve(); err != nil {
			log.Fatalf("socketio listen error: %s\n", err)
		}
	}()
	defer server.Close()

	// router.Use(GinMiddleware("http://localhost:4000"))
	router.Use(gin.Recovery())
	router.GET("/socket.io/*any", gin.WrapH(server))
	router.POST("/socket.io/*any", gin.WrapH(server))
	// router.StaticFS("/public", http.Dir("../asset"))

	router.LoadHTMLGlob("templates/*")
	router.Static("/public", "./public")

	router.GET("/", handlers.Index)
	router.GET("/:room", handlers.Room)

	if err := router.Run(":3000"); err != nil {
		log.Fatal("failed run app: ", err)
	}
}
