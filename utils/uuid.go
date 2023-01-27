package utils

import (
	"strings"

	"github.com/google/uuid"
)

func GenerateUuid() string {
	uuidValue := uuid.New()
	uuid := strings.Replace(uuidValue.String(), "-", "", -1)
	return uuid
}
