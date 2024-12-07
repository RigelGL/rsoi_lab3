package main

import (
	"rsoi/model"
	"testing"

	"github.com/stretchr/testify/assert"
)

var personId int64 = 0

func Test_CreatePerson(t *testing.T) {
	var name = "User"
	var age int32 = 10
	var work = "No"
	var address = "City"

	id, err := GetDba().addNewPerson(&model.PersonRequest{Name: &name, Age: &age, Work: &work, Address: &address})

	personId = id

	assert.Equal(t, 0, err.code)

	res, err := GetDba().findPersonById(id)
	assert.Equal(t, 0, err.code)

	assert.Equal(t, name, *res.Name)
	assert.Equal(t, age, *res.Age)
	assert.Equal(t, work, *res.Work)
	assert.Equal(t, address, *res.Address)
}

func Test_GetPerson(t *testing.T) {
	res, err := GetDba().findPersonById(personId)

	assert.Equal(t, 0, err.code)
	assert.Equal(t, personId, res.Id)
	assert.Equal(t, "User", *res.Name)
	assert.Equal(t, int32(10), *res.Age)
	assert.Equal(t, "No", *res.Work)
	assert.Equal(t, "City", *res.Address)
}

func Test_UpdatePerson(t *testing.T) {
	var age int32 = 12
	var work = "NoUpd"
	var address = "CityUpd"
	err := GetDba().updatePersonById(personId, &model.PersonRequest{Age: &age, Work: &work, Address: &address})

	assert.Equal(t, 0, err.code)

	res, err := GetDba().findPersonById(personId)
	assert.Equal(t, 0, err.code)
	assert.Equal(t, personId, res.Id)
	assert.Equal(t, "User", *res.Name)
	assert.Equal(t, "NoUpd", *res.Work)
	assert.Equal(t, "CityUpd", *res.Address)
}

func Test_PersonsList(t *testing.T) {
	persons, err := GetDba().findPersons("")

	assert.Equal(t, 0, err.code)
	assert.Equal(t, 1, len(persons.Items))
	assert.Equal(t, "User", *persons.Items[0].Name)
}

func Test_DeletePerson(t *testing.T) {
	_, err := GetDba().findPersonById(personId)
	assert.Equal(t, 0, err.code)

	err = GetDba().deletePersonById(personId)
	assert.Equal(t, 0, err.code)

	_, err = GetDba().findPersonById(personId)
	assert.Equal(t, 404, err.code)
}
