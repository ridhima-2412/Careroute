FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/ ./backend/
COPY database/ ./database/
COPY logic/ ./logic/

RUN npm ci --omit=dev

CMD ["node", "backend/server.js"]
