FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY src/ ./src/
ENV NODE_ENV=production
EXPOSE 8088
HEALTHCHECK --interval=30s --timeout=5s \
    CMD wget -qO- http://localhost:8088/health || exit 1
CMD ["node", "src/index.js"]
