package main

import (
	"fmt"
	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
	"github.com/segmentio/kafka-go"
	"os"
	"os/signal"
	"syscall"

	_ "github.com/lib/pq"

	"log"
)

func closeProducer() {
	writer.Close()
}

// init is invoked before main()
func init() {
	log.Println(os.Getenv("DB_URL"))

	if err := godotenv.Load(); err != nil {
		log.Print("No .env file found")
	}
}

func main() {
	ConnectDba(os.Getenv("DB_URL"), os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"))
	GetDba().initTables()

	writer = &kafka.Writer{
		Addr:     kafka.TCP("localhost:9092"),
		Topic:    "logs",
		Balancer: &kafka.LeastBytes{},
	}

	defer closeProducer()

	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigs
		closeProducer()
		os.Exit(0)
	}()

	app := fiber.New()

	app.Get("/manage/health", func(c *fiber.Ctx) error {
		c.Status(200)
		return c.SendString("OK")
	})

	v1 := app.Group("/api/v1")
	BindApi(v1)

	port, exists := os.LookupEnv("APP_PORT")
	if !exists {
		port = "8080"
	}
	fmt.Printf("Server runs at %v\n", port)
	SendLog("Starting")
	log.Fatalln(app.Listen(fmt.Sprintf("0.0.0.0:%v", port)))
}
