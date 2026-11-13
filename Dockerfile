# =================================================================
# Stage 1: Build Frontend (React + Vite + Tailwind + Leaflet)
# =================================================================
FROM oven/bun:alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package.json ./
RUN bun install

COPY frontend/ ./
RUN bun run build

# =================================================================
# Stage 2: Build Backend (Go Microservice & Spatial Engine)
# =================================================================
FROM golang:alpine AS backend-builder
WORKDIR /app/backend
RUN apk add --no-cache git

COPY backend/ ./
RUN go mod tidy && CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server

# =================================================================
# Stage 3: Unified Lightweight Runtime Container
# =================================================================
FROM alpine:3.19
WORKDIR /app
RUN apk add --no-cache ca-certificates tzdata

COPY --from=backend-builder /app/backend/server .
COPY --from=backend-builder /app/backend/api ./api
COPY --from=frontend-builder /app/frontend/dist ./dist

EXPOSE 8080
ENV PORT=8080
ENV GIN_MODE=release

CMD ["./server"]
