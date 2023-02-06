package utils

import (
	"fmt"
	"strconv"
	"time"
)

func GetCurrentTime() []string {
	t := time.Now()
	hour := t.Hour()
	minute := strconv.Itoa(t.Minute())
	if len(minute) < 2 {
		minute = "0" + minute
	}

	var ti string
	if hour <= 5 {
		ti = "凌晨"
	} else if hour <= 11 {
		ti = "上午"
	} else if hour <= 17 {
		ti = "下午"
	} else {
		ti = "晚上"
	}
	hourStr := strconv.Itoa(hour)
	result := []string{ti, fmt.Sprintf("%v:%v", hourStr, minute)}

	return result
}
