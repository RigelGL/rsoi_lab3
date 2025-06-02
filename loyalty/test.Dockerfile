FROM maven:3.8.8-eclipse-temurin-21-alpine
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline

COPY . .
RUN mvn clean compile assembly:single
CMD ["mvn", "test"]