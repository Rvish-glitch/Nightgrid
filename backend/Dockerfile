# Build Stage
FROM golang:alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY . .
RUN go mod tidy && CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server

# Final Lightweight Runtime Stage
FROM alpine:3.19

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata

COPY --from=builder /app/server .
COPY --from=builder /app/api ./api

EXPOSE 8080

CMD ["./server"]

