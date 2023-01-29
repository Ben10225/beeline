package utils

import (
	"strings"
	"time"
)

func GenerateCurrentNumber() string {
	time := (time.Now().Format("20060102150405.999999"))
	lst := strings.Split(time, ".")
	suffix := lst[1]

	if len(lst[1]) < 6 {
		for i := len(lst[1]); i < 6; i++ {
			suffix += "0"
		}
	}
	return lst[0] + suffix
}
