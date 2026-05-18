FROM node:24-alpine
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY frontend ./frontend
COPY tests ./tests
ENV NODE_ENV=production
CMD ["node", "src/services/gateway/server.js"]
