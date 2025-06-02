FROM node:lts-alpine3.19
WORKDIR /app
RUN apk add openssl
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN chmod +x ./genkeys.sh
RUN chmod +x ./entrypoint.sh
CMD ["./entrypoint.sh"]