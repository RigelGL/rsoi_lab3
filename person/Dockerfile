FROM golang:1.23.1-alpine as build

RUN apk update && apk upgrade && apk add --no-cache

WORKDIR /app

COPY ./go.mod ./go.mod
COPY ./go.sum ./go.sum

RUN go mod tidy

COPY . .

RUN go build -o main .

FROM golang:1.23.1-alpine

COPY --from=build /app/main /app/main
COPY ./res ./res

ENTRYPOINT ["/app/main"]