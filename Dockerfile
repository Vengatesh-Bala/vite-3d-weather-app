# Multi-stage build for Vite + Three.js app

# 1) Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Install deps first for better caching
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN npm ci || npm install

# Copy sources and build
COPY . .
RUN npm run build

# 2) Serve stage (nginx)
FROM nginx:1.27-alpine
# Copy build output
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx config for SPA and gzip
RUN printf "server {\n  listen 80;\n  server_name _;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n  gzip on;\n  gzip_types text/plain text/css application/json application/javascript application/xml+rss application/xml image/svg+xml;\n}\n" > /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK CMD wget -qO- http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
