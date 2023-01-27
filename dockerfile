FROM golang:1.19.5-alpine

WORKDIR /app

COPY . .
RUN go mod download
RUN go build -o app

EXPOSE 3000
ENTRYPOINT  ["./app"]