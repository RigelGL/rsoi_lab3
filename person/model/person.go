package model

type PersonData struct {
	Id      *string `json:"id"`
	Name    *string `json:"name"`
	Age     *int32  `json:"age"`
	Address *string `json:"address"`
	Work    *string `json:"work"`
}

type PersonRequest struct {
	Id      *string `json:"id"`
	Name    *string `json:"name"`
	Age     *int32  `json:"age"`
	Address *string `json:"address"`
	Work    *string `json:"work"`
}

type IdOnly struct {
	Id *string `json:"id"`
}
