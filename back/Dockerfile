# 1. 빌드 (Maven으로 jar 파일 만들기)
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app
COPY . .
# 테스트 생략하고 빠르게 빌드
RUN mvn clean package -DskipTests

# 2. 실행 단계
# [수정] openjdk:17-jdk-slim -> amazoncorretto:17
FROM amazoncorretto:17
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]