package main

import (
	"context"
	"encoding/json"
	"github.com/segmentio/kafka-go"
)

var writer *kafka.Writer

func SendLog(message string, level ...string) {
	if writer == nil {
		return
	}

	logLevel := "info"

	if len(level) > 0 {
		logLevel = level[0]
	}

	data, err := json.Marshal(map[string]interface{}{
		"service": "person",
		"level":   logLevel,
		"message": message,
	})

	if err != nil {
		return
	}

	err = writer.WriteMessages(context.Background(), kafka.Message{Value: data})
}
