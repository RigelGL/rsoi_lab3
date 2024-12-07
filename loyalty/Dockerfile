FROM maven:3.8.8-eclipse-temurin-21-alpine AS build
WORKDIR /app
COPY res res
COPY pom.xml pom.xml
COPY src src
RUN mvn clean compile assembly:single

#
# PACKAGE STAGE
#
FROM openjdk:21-slim
WORKDIR /app
COPY --from=build /app/target/app.jar app.jar
COPY res res
EXPOSE 8080
CMD ["java","-jar","app.jar"]