# 1) Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Install deps
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Copy source
COPY . .
RUN npm run build

# 2) Serve stage
FROM nginx:1.27-alpine

# Copy build output
COPY --from=build /app/dist /usr/share/nginx/html

# Custom nginx config with runtime env injection
RUN printf "server {\n\
  listen 80;\n\
  server_name _;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  location / {\n\
    try_files \$uri \$uri/ /index.html;\n\
  }\n\
  location /config.js {\n\
    default_type application/javascript;\n\
    return 200 'window.RUNTIME_CONFIG = { VITE_WEATHER_API_KEY: \"$VITE_WEATHER_API_KEY\" };';\n\
  }\n\
}\n" > /etc/nginx/conf.d/default.conf

EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
