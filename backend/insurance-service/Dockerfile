# Stage 1: Build stage using Maven and OpenJDK 17
FROM maven:3.9.6-eclipse-temurin-17 AS builder

WORKDIR /app

# Copy Maven descriptor and fetch dependencies to leverage Docker caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build the application artifact
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime stage using a lightweight JRE 17 image
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy the built jar file from the builder stage
COPY --from=builder /app/target/*.jar app.jar

# Expose insurance-service port
EXPOSE 8081

# Run the Spring Boot application with dynamic PORT binding
ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT:-8081} -jar app.jar"]
