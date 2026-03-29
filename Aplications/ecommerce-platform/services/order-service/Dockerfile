# services/order-service/Dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o order-service .

FROM alpine:3.19
RUN apk add --no-cache ca-certificates wget
WORKDIR /app
COPY --from=builder /app/order-service .
EXPOSE 8083
HEALTHCHECK --interval=30s --timeout=5s \
    CMD wget -qO- http://localhost:8083/health || exit 1
CMD ["./order-service"]