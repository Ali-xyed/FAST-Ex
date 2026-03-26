FROM node:lts-alpine3.23
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
EXPOSE 5006
CMD ["npm", "run", "dev"]
