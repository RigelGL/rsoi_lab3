FROM node:lts-alpine3.19
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD [ "node", "index.js" ]