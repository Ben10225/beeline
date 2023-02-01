package api

import (
	"beeline/models"
	"beeline/structs"
	"beeline/utils"
	"bytes"
	"encoding/base64"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3/s3manager"
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

	bgColor := []string{"#228fe8", "#2c8e22", "#FE981C", "#db2e2e", "#b65ed1", "#1dadad", "#e1b30f", "#bf95ff", "#048ef1"}
	rand.Seed(time.Now().Unix())
	color := bgColor[rand.Intn(len(bgColor))]

	status := models.CreateUser(c, uuid, name, email, password, color)

	if !status {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   true,
			"message": "伺服器錯誤",
		})
		return
	}

	token, _ := utils.MakeToken(uuid, name, color)
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

	token, _ := utils.MakeToken(userData.Uuid, userData.Name, userData.ImgUrl)
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

func GetRemoteUser(c *gin.Context) {
	var req structs.RoomData
	err := c.BindJSON(&req)
	if err != nil {
		log.Fatal(err)
	}
	roomId := req.RoomId
	uuid := req.Uuid

	userData := models.GetUserByUuid(c, uuid)

	userStreamStatus := models.GetStatusByUuid(c, roomId, uuid)

	c.JSON(http.StatusOK, gin.H{
		"data": gin.H{
			"name":        userData.Name,
			"imgurl":      userData.ImgUrl,
			"audioStatus": userStreamStatus.AudioStatus,
			"videoStatus": userStreamStatus.VideoStatus,
		},
	})
}

func UploadImg(c *gin.Context) {
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
	var req structs.ImageUpload
	err = c.BindJSON(&req)
	if err != nil {
		log.Fatal(err)
	}
	imgData := req.ImgData
	fileName := req.FileName

	imgFile := strings.Split(imgData, ",")[1]
	imgDecode, _ := base64.StdEncoding.DecodeString(imgFile)

	prefix := strings.Split(fileName, ".")[0]
	extension := strings.Split(fileName, ".")[1]

	timeString := utils.GenerateCurrentNumber()
	newFileName := fmt.Sprintf("%v-%v.%v", prefix, timeString, extension)

	sess, err := session.NewSession(&aws.Config{
		Region: aws.String("us-west-2"),
		Credentials: credentials.NewStaticCredentials(
			utils.EnvValue("AWS_ACCESS_KEY_ID"),
			utils.EnvValue("AWS_SECRET_ACCESS_KE"),
			"",
		),
	})
	if err != nil {
		log.Fatal(err)
	}

	uploader := s3manager.NewUploader(sess)
	bucket := utils.EnvValue("BUCKET_NAME")

	//upload to the s3 bucket
	up, err := uploader.Upload(&s3manager.UploadInput{
		Bucket:      aws.String(bucket),
		ACL:         aws.String("public-read"),
		Key:         aws.String(newFileName),
		Body:        bytes.NewReader(imgDecode),
		ContentType: aws.String(extension),
	})
	if err != nil {
		fmt.Println(err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":    "Failed to upload file",
			"uploader": up,
		})
		return
	}

	imgCDN := fmt.Sprintf("https://d20v81onua1yrc.cloudfront.net/%v", newFileName)
	models.UpdateUserImg(c, payload.Uuid, imgCDN)

	newtoken, _ := utils.MakeToken(payload.Uuid, payload.Name, imgCDN)
	c.SetCookie("token", newtoken, 0, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{
		"ok": true,
	})
}

func SetNewUuid(c *gin.Context) {
	req := struct {
		OldUuid string
		NewUuid string
	}{}
	err := c.BindJSON(&req)
	if err != nil {
		log.Fatal(err)
	}
	oldUuid := req.OldUuid
	newUuid := req.NewUuid

	models.UpdateUserUuid(c, oldUuid, newUuid)

	c.JSON(http.StatusOK, gin.H{
		"ok": true,
	})
}

/*
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
*/
