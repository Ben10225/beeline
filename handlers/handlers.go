package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func Index(c *gin.Context) {
	// uuid, _ := uuid.NewRandom()
	// room := uuid.String()
	// fmt.Println(uuid)
	// c.Redirect(http.StatusFound, fmt.Sprintf("/%s", room))
	c.HTML(http.StatusOK, "index.html", nil)
}

func Room(c *gin.Context) {
	room := c.Param("room")
	c.HTML(http.StatusOK, "room.html", gin.H{
		"roomId": room,
	})
}
