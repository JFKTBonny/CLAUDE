# Ecommerce Platform — Project Context

## Repo
https://github.com/JFKTBonny/CLAUDE
Path: Aplications/ecommerce-platform/

## Stack
- API Gateway:     Node.js/Express     :3000
- User Service:    Java/Spring Boot    :8081
- Product Service: Python/FastAPI      :8082
- Order Service:   Go                  :8083
- Cart Service:    Node.js             :8085 (built, not tested)
- MySQL:           users_db, products_db, orders_db, cart_db
- Jenkins:         port 8084 (mapped from 8080 internally)
- Docker Hub:      santonix/*

## Infrastructure
- Docker Compose:  ~/CLAUDE/Aplications/ecommerce-platform/
- Git repo:        https://github.com/JFKTBonny/CLAUDE
- Jenkins job:     ecommerce-platform/ecommerce-pipeline
- Jenkins volume:  /home/bonny/CLAUDE/Aplications/ecommerce-platform/jenkins_home
- Jenkins mount:   -v /home/bonny/CLAUDE:/home/bonny/CLAUDE (identity mount)

## CI/CD Status
- Pipeline:        6/6 smoke tests passing (Build #97)
- Jenkinsfile:     Aplications/ecommerce-platform/Jenkinsfile

## Known Fixes Applied
- Docker socket:   sudo chmod 666 /var/run/docker.sock (resets on restart)
- Gateway path:    uses req.fullPath saved before Express strips prefix
- Order schema:    orders + order_items tables (product_id moved to order_items)
- Cart port:       8085 (8084 taken by Jenkins)

## Business Logic Done
- Product categories (5 seeded: Electronics, Clothing, Books, Home, Sports)
- Product search, filter by category, price range, stock
- Order with multiple items, auto total calculation
- Order status: PENDING/CONFIRMED/SHIPPED/DELIVERED/CANCELLED
- Cart service: written, needs testing

## Credentials
- DB:  root/walter
- JWT: bonny-walter-super-secret-key-2024
- Docker Hub: santonix

## Next Steps (in order)
1. Test cart service (add to cart, checkout)
2. Order workflow (status transitions in Go)
3. User roles admin/customer (Java)
4. Frontend React + Vite
5. Jenkins multi-env pipeline
6. SonarQube, Blue-Green, Rollback, Notifications
7. Kubernetes
