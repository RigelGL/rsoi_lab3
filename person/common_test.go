package main

import (
	_ "github.com/lib/pq"
	"os"
	"testing"
)

func TestMain(m *testing.M) {
	ConnectDba(os.Getenv("DB_URL"), os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"))
	GetDba().initTables()

	retCode := m.Run()

	GetDba().close()

	os.Exit(retCode)
}
