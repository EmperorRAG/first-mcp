FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 3001

CMD ["node", "build/index.js"]
