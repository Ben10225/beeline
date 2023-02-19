package utils

import (
	"fmt"
	"math/rand"
	"strconv"
	"time"
)

func GenerateGameValue() []string {
	rand.Seed(time.Now().UnixNano())
	width := rand.Intn(90-5) + 5

	// rand.Seed(time.Now().UnixNano())
	height := rand.Intn(70-5) + 5

	// rand.Seed(time.Now().UnixNano())
	delay := 1 + rand.Float64()*(3-1)

	return []string{strconv.Itoa(width), strconv.Itoa(height), fmt.Sprintf("%f", delay)}
}
