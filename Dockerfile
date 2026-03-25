FROM node:18-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm install --build-from-source
COPY . .
RUN npm run build
EXPOSE 80
CMD ["npm", "start"]
