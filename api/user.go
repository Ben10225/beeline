package api

import (
	"beeline/models"
	"beeline/structs"
	"beeline/utils"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func Auth(c *gin.Context) {
	token, err := c.Cookie("token")
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"error": true,
		})
		return
	}
	payload, err := utils.ParseToken(token)
	if err != nil {
		c.SetCookie("token", "", -1, "/", "", false, true)
		c.JSON(http.StatusOK, gin.H{
			"error": true,
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"ok": true,
		"data": gin.H{
			"uuid":   payload.Uuid,
			"name":   payload.Name,
			"imgUrl": payload.ImgUrl,
		},
	})
}

func Signup(c *gin.Context) {
	var req structs.SignData
	err := c.BindJSON(&req)
	if err != nil {
		log.Fatal(err)
	}
	name := req.Name
	email := req.Email
	password := req.Password

	emailExist := models.CheckEmailExist(c, email)
	if emailExist {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   true,
			"message": "此信箱已存在",
		})
		return
	}

	uuid := utils.GenerateUuid()
	password, _ = utils.PwdHash(password)

	status := models.CreateUser(c, uuid, name, email, password)

	if !status {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   true,
			"message": "伺服器錯誤",
		})
		return
	}

	token, _ := utils.MakeToken(uuid, name, "")
	c.SetCookie("token", token, 0, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{
		"ok": true,
	})
}

func Signin(c *gin.Context) {
	var req structs.SignData
	err := c.BindJSON(&req)
	if err != nil {
		log.Fatal(err)
	}
	email := req.Email
	password := req.Password

	userData, emailExist := models.GetUser(c, email)
	if !emailExist {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   true,
			"message": "信箱或密碼錯誤",
		})
		return
	}

	checked := utils.PwdVerify(password, userData.Password)
	if !checked {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   true,
			"message": "信箱或密碼錯誤",
		})
		return
	}

	token, _ := utils.MakeToken(userData.Uuid, userData.Name, "")
	c.SetCookie("token", token, 0, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{
		"ok": true,
	})
}

func Signout(c *gin.Context) {
	c.SetCookie("token", "", -1, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{
		"ok": true,
	})
}

func GetUserName(c *gin.Context) {
	var req structs.User
	err := c.BindJSON(&req)
	if err != nil {
		log.Fatal(err)
	}
	peerId := req.PeerId

	userData := models.GetUserByPeerId(c, peerId)

	c.JSON(http.StatusOK, gin.H{
		"data": userData.Name,
	})
}

func SetUserPeerId(c *gin.Context) {
	var req structs.User
	err := c.BindJSON(&req)
	if err != nil {
		log.Fatal(err)
	}
	uuid := req.Uuid
	peerId := req.PeerId

	models.SetPeerIdByUuid(c, uuid, peerId)

	c.JSON(http.StatusOK, gin.H{
		"ok": true,
	})
}

func GetUserPeerId(c *gin.Context) {
	var req structs.User
	err := c.BindJSON(&req)
	if err != nil {
		log.Fatal(err)
	}
	uuid := req.Uuid

	userData := models.GetPeerIdByUuidAndRemove(c, uuid)

	c.JSON(http.StatusOK, gin.H{
		"data": userData.PeerId,
	})

}
