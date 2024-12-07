package model

type PersonData struct {
	Id      int64   `json:"id"`
	Name    *string `json:"name"`
	Age     *int32  `json:"age"`
	Address *string `json:"address"`
	Work    *string `json:"work"`
}

type PersonRequest struct {
	Name    *string `json:"name"`
	Age     *int32  `json:"age"`
	Address *string `json:"address"`
	Work    *string `json:"work"`
}
