FROM node:lts-alpine3.23
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5007
CMD ["npm", "run", "dev"]
