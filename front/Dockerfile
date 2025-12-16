# Node.js 20 버전 사용
FROM node:20-alpine

WORKDIR /app

# 패키지 설치 먼저 (속도 최적화)
COPY package*.json ./
RUN npm install

# 소스 코드 복사 및 빌드
COPY . .
RUN npm run build

# 3000번 포트 열기
EXPOSE 3000

# 서버 실행
CMD ["npm", "start"]