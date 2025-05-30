package main

import (
	"fmt"
	"github.com/gofiber/fiber/v2"
	"net/http"
	"rsoi/model"
)

func getPersons(c *fiber.Ctx) error {
	search := c.Query("search", "")

	persons, err := GetDba().findPersons(search)

	SendLog("getPersons " + search)

	if err.code == 500 {
		SendLog("Cant get persons "+search, "error")
		return c.Status(500).Send(nil)
	}

	return c.JSON(persons.Items)
}

func getPerson(c *fiber.Ctx) error {
	id := c.Params("id")
	var person, err = GetDba().findPersonById(id)

	if err.code == 404 {
		SendLog("Person not found "+id, "warning")
		return c.Status(404).Send(nil)
	}

	SendLog("Get person "+id, "info")

	return c.JSON(person)
}

func addPerson(c *fiber.Ctx) error {
	u := new(model.PersonRequest)

	if err := c.BodyParser(u); err != nil {
		return c.Status(http.StatusBadRequest).SendString(err.Error())
	}

	id, err := GetDba().addNewPerson(u)

	if err.code == 500 {
		SendLog("Cant add person", "error")
		return c.Status(http.StatusInternalServerError).Send(nil)
	}

	c.Set("Location", fmt.Sprintf("/api/v1/persons/%v", id))

	SendLog("Person added "+id, "warning")

	return c.Status(http.StatusCreated).JSON(struct {
		Id string `json:"id"`
	}{id})
}

func updatePerson(c *fiber.Ctx) error {
	id := c.Params("id")
	u := new(model.PersonRequest)

	if err := c.BodyParser(u); err != nil {
		return c.Status(http.StatusBadRequest).SendString(err.Error())
	}

	err := GetDba().updatePersonById(id, u)

	if err.code == 404 {
		SendLog("Person not found "+id, "warning")
		return c.Status(http.StatusNotFound).Send(nil)
	}
	if err.code == 500 {
		SendLog("Cant update person "+id, "error")
		return c.Status(http.StatusInternalServerError).Send(nil)
	}

	person, err := GetDba().findPersonById(id)

	return c.Status(http.StatusOK).JSON(person)
}

func deletePerson(c *fiber.Ctx) error {
	id := c.Params("id")
	err := GetDba().deletePersonById(id)

	if err.code == 404 {
		SendLog("Cant delete person (not found) "+id, "warning")
		return c.Status(http.StatusNotFound).Send(nil)
	}

	if err.code == 500 {
		SendLog("Cant delete person "+id, "error")
		return c.Status(http.StatusInternalServerError).Send(nil)
	}

	return c.Status(http.StatusNoContent).Send(nil)
}

func BindApi(router fiber.Router) {
	persons := router.Group("persons", func(c *fiber.Ctx) error {
		c.Set("Content-Type", "application/json")
		return c.Next()
	})

	persons.Get("", getPersons)
	persons.Get(":id", getPerson)
	persons.Post("", addPerson)
	persons.Patch(":id", updatePerson)
	persons.Delete(":id", deletePerson)

	SendLog("Api init")
}
