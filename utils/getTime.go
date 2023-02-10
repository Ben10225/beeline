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

	// if hour <= 5 {
	// 	ti = "凌晨"
	// } else if hour <= 11 {
	// 	ti = "上午"
	// } else if hour <= 17 {
	// 	ti = "下午"
	// } else {
	// 	ti = "晚上"
	// }

	var ti string
	hour += 8
	if hour > 23 {
		hour -= 24
	}

	if hour <= 11 {
		ti = "AM"
	} else {
		ti = "PM"
	}
	hourStr := strconv.Itoa(hour)
	result := []string{fmt.Sprintf("%v:%v", hourStr, minute), ti}

	return result
}
