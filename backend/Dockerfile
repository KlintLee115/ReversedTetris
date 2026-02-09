# Stage 1: Build the application
FROM golang:1.23.9-alpine3.21 AS builder
WORKDIR /app
COPY . .
RUN go mod download
# Create output directory
RUN mkdir -p output
# Build the executable in the output directory
RUN go build -o output/reversed_tetris .

# Stage 2: Create minimal runtime image 
FROM alpine:latest AS runner
RUN apk --no-cache add ca-certificates
WORKDIR /app
# Copy only the executable from the output directory
COPY --from=builder /app/output/reversed_tetris .
EXPOSE 8080
# Run the executable
CMD ["./reversed_tetris"]