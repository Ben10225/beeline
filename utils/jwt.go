package utils

import (
	"beeline/structs"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v4"
)

var MySecret = []byte("secccret")

func Secret() jwt.Keyfunc {
	return func(token *jwt.Token) (interface{}, error) {
		return []byte("secccret"), nil
	}
}

func MakeToken(uuid, name, imgUrl string) (string, error) {
	claim := structs.MyClaims{
		Uuid:   uuid,
		Name:   name,
		ImgUrl: imgUrl,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour * time.Duration(1))),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claim)
	tokenString, err := token.SignedString(MySecret)
	return tokenString, err
}

func ParseToken(jwtToken string) (*structs.MyClaims, error) {
	token, err := jwt.ParseWithClaims(jwtToken, &structs.MyClaims{}, Secret())
	if err != nil {
		if ve, ok := err.(*jwt.ValidationError); ok {
			if ve.Errors&jwt.ValidationErrorMalformed != 0 {
				return nil, errors.New("thats's not even a token")
			} else if ve.Errors&jwt.ValidationErrorExpired != 0 {
				return nil, errors.New("token is expired")
			} else if ve.Errors&jwt.ValidationErrorNotValidYet != 0 {
				return nil, errors.New("token not active yet")
			} else {
				return nil, errors.New("couldn't handle this token")
			}
		}
	}
	if claims, ok := token.Claims.(*structs.MyClaims); ok && token.Valid {
		return claims, nil
	}
	return nil, errors.New("couldn't handle this token")
}
