.PHONY: dev gen test lint docker tidy

dev:
	go run ./cmd/api

gen:
	go run github.com/99designs/gqlgen generate

test:
	go test ./... -race -count=1

lint:
	golangci-lint run ./...

docker:
	docker build -t sigma-api:latest .

tidy:
	go mod tidy
