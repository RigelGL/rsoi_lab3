package model

type ArrayResult[T any] struct {
	Pages int `json:"pages" `
	Count int `json:"count"`
	Items []T `json:"items" swaggerignore:"true"`
}

func NewArrayResult[T any](count int, limit int, items []T) *ArrayResult[T] {
	if limit <= 0 {
		limit = 1
	}
	return &ArrayResult[T]{Pages: (count + limit - 1) / limit, Count: count, Items: items}
}
