# services/user-service/Dockerfile
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src/ ./src/
RUN mvn package -DskipTests -q

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8081
HEALTHCHECK --interval=30s --timeout=5s \
    CMD wget -qO- http://localhost:8081/actuator/health || exit 1
CMD ["java", "-jar", "app.jar"]