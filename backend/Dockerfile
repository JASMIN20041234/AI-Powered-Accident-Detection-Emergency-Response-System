FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN node scripts/migrate.js
EXPOSE 5000
CMD ["node", "src/server.js"]
