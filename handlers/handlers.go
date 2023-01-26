package handlers

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func Index(c *gin.Context) {
	uuid := uuid.New()
	room := uuid.String()
	c.Redirect(http.StatusMovedPermanently, fmt.Sprintf("/%s", room))
	// c.HTML(http.StatusOK, "index.html", nil)
}

func Room(c *gin.Context) {
	room := c.Param("room")
	c.HTML(http.StatusOK, "index.html", gin.H{
		"roomId": room,
	})
}
