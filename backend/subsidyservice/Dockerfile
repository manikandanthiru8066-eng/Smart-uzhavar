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

# Expose subsidyservice port
EXPOSE 8080

# Run the Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]
