# syntax=docker/dockerfile:1.5   ← habilita recursos novos do Dockerfile

########################  ETAPA 1 – instalar dependências  ########################
FROM node:20-slim AS deps

WORKDIR /app

# Copiamos apenas package.json + lockfile p/ aproveitar cache entre builds
COPY package*.json ./

# Instala dependências travadas (sem dev‑deps: tests/lint ficam fora da imagem)
RUN npm ci --omit=dev

########################  ETAPA 2 – imagem final  #################################
FROM node:20-slim

# (Opcional) instalar expo-cli global; se preferir use npx no CMD
RUN npm i -g expo-cli

WORKDIR /app

# Reaproveita node_modules da etapa 1
COPY --from=deps /app/node_modules ./node_modules

# Copia o restante do código-fonte
COPY . .

# Portas usadas pelo Metro Bundler / Expo Go
EXPOSE 8081 19000 19001 19002

# IMPORTANTE: passe variáveis (.env) em tempo de execução, não no Dockerfile
CMD ["expo", "start", "--tunnel", "--clear"]
