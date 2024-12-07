package main

import (
	"fmt"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/swagger"
	"github.com/joho/godotenv"
	"os"
	_ "rsoi/docs"

	_ "github.com/lib/pq"

	"log"
)

// init is invoked before main()
func init() {
	if err := godotenv.Load(); err != nil {
		log.Print("No .env file found")
	}
}

// @title Persons API
// @version 0.1
// @description Апи для лабы 1
// @contact.name RigelLab
// @contact.url https://t.me/rigellabru
// @host rsoi-awsy.onrender.com
// @BasePath /api/v1
func main() {
	ConnectDba(os.Getenv("DB_HOST"), os.Getenv("DB_NAME"), os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"))
	GetDba().initTables()

	app := fiber.New()

	app.Get("/manage/health", func(c *fiber.Ctx) error {
		c.Status(200)
		return c.SendString("OK")
	})

	v1 := app.Group("/api/v1")
	BindApi(v1)

	app.Get("/swagger/*", swagger.HandlerDefault)

	port, exists := os.LookupEnv("APP_PORT")
	if !exists {
		port = "8080"
	}
	fmt.Printf("Server runs at %v\n", port)
	log.Fatalln(app.Listen(fmt.Sprintf(":%v", port)))
}
