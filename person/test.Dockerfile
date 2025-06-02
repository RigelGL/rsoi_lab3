FROM golang:1.24.1-alpine
RUN apk update && apk upgrade && apk add --no-cache
WORKDIR /app
COPY ./go.mod ./go.mod
COPY ./go.sum ./go.sum
RUN go mod tidy
COPY . .
RUN go build -o main .
CMD ["go", "test"]