package handlers

import (
	"beeline/utils"
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
	token, err := c.Cookie("token")
	if err != nil {
		c.Redirect(http.StatusFound, "/")
	}
	payload, err := utils.ParseToken(token)
	if err != nil {
		c.SetCookie("token", "", -1, "/", "", false, true)
		c.Redirect(http.StatusFound, "/")
	}

	room := c.Param("room")
	c.HTML(http.StatusOK, "room.html", gin.H{
		"roomId": room,
		"userId": payload.Uuid,
	})
}
