# syntax=docker/dockerfile:1.5

FROM node:20-slim AS deps

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps
RUN npm install @expo/ngrok --no-save --legacy-peer-deps

FROM node:20-slim

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.68

EXPOSE 8081 
CMD ["npx", "expo", "start", "--clear", "--host", "lan"]