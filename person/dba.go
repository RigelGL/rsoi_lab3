package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"rsoi/model"
)

type DbStatus struct {
	code int
}

type Dba struct {
	db *sql.DB
}

var instance *Dba

func GetDba() *Dba {
	if instance == nil {
		log.Fatal("You must call ConnectDba before GetDba")
	}
	return instance
}

func ConnectDba(url, user, password string) {
	log.Printf("USE DB %v, as %v", url, user)

	var err error
	db, err := sql.Open("postgres", "postgresql://"+user+":"+password+"@"+url+"?sslmode=disable")
	if err != nil {
		log.Fatal(err)
	}
	instance = &Dba{db: db}
}

func (s Dba) close() {
	s.db.Close()
}

func (s Dba) initTables() {
	code, err := os.ReadFile("./res/init.sql")
	if err != nil {
		log.Fatal(err)
	}

	_, err = s.db.Exec(string(code))

	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("DB UPDATED")
}

func (s Dba) findPersons(search string) (*model.ArrayResult[model.PersonData], DbStatus) {
	var res model.PersonData
	var persons = []model.PersonData{}
	rows, err := s.db.Query(
		`SELECT id, name, age, address, work
				FROM person
				WHERE name ILIKE $1 OR address LIKE $1 OR work LIKE $1
				ORDER BY id`,
		fmt.Sprintf("%%%s%%", search))
	defer rows.Close()

	if err != nil {
		log.Println(err)
		return nil, DbStatus{code: 500}
	}

	for rows.Next() {
		rows.Scan(&res.Id, &res.Name, &res.Age, &res.Address, &res.Work)
		persons = append(persons, res)
	}

	return model.NewArrayResult[model.PersonData](len(persons), len(persons), persons), DbStatus{code: 0}
}

func (s Dba) findPersonById(id string) (model.PersonData, DbStatus) {
	row := s.db.QueryRow(
		`SELECT id, name, age, address, work
				FROM person
				WHERE id = $1`, id)
	var res model.PersonData

	err := row.Scan(&res.Id, &res.Name, &res.Age, &res.Address, &res.Work)
	if err != nil {
		log.Println(err)
		return res, DbStatus{code: 404}
	}

	return res, DbStatus{code: 0}
}

func (s Dba) addNewPerson(request *model.PersonRequest) (string, DbStatus) {
	var id string
	err := s.db.QueryRow(
		`INSERT INTO person (id, name, age, address, work)
				VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET name = $2, age = $3, address = $4, work = $5
				RETURNING id`,
		request.Id, request.Name, request.Age, request.Address, request.Work).Scan(&id)
	if err != nil {
		log.Println(err)
		return "", DbStatus{code: 500}
	}
	return id, DbStatus{code: 0}
}

func (s Dba) updatePersonById(id string, request *model.PersonRequest) DbStatus {
	person, personErr := s.findPersonById(id)

	if personErr.code == 0 {
		if request.Name == nil {
			request.Name = person.Name
		}

		if request.Age == nil {
			request.Age = person.Age
		}

		if request.Work == nil {
			request.Work = person.Work
		}

		if request.Address == nil {
			request.Address = person.Address
		}
	}

	res, err := s.db.Exec(
		`UPDATE person
				SET name=$1,
					age=$2,
					address=$3,
					work=$4
				WHERE id = $5`,
		request.Name, request.Age, request.Address, request.Work, id)
	if amount, _ := res.RowsAffected(); amount == 0 {
		return DbStatus{code: 404}
	}
	if err != nil {
		log.Println(err)
		return DbStatus{code: 500}
	}
	return DbStatus{code: 0}
}

func (s Dba) deletePersonById(id string) DbStatus {
	var count int
	err := s.db.QueryRow(
		`WITH deleted AS (DELETE FROM person WHERE id = $1 RETURNING id)
				SELECT count(*)
				FROM deleted`,
		id).Scan(&count)
	if err != nil {
		log.Println(err)
		return DbStatus{code: 500}
	}

	if count == 0 {
		return DbStatus{code: 404}
	}

	return DbStatus{code: 0}
}
