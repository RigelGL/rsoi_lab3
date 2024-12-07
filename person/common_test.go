package main

import (
	"fmt"
	_ "github.com/lib/pq"
	"os"
	"testing"
)

func TestMain(m *testing.M) {
	tmpDBName := fmt.Sprintf("test_%d", os.Getpid())

	CreateDatabase(os.Getenv("DB_HOST"), tmpDBName, os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"))
	ConnectDba(os.Getenv("DB_HOST"), tmpDBName, os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"))
	GetDba().initTables()

	retCode := m.Run()

	GetDba().close()
	DropDatabase(os.Getenv("DB_HOST"), tmpDBName, os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"))

	os.Exit(retCode)
}
