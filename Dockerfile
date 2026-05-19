FROM node:24-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev || true
COPY src ./src
COPY frontend ./frontend
COPY tests ./tests
ENV NODE_ENV=production
CMD ["node", "src/services/gateway/server.js"]
