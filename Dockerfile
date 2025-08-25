# 1) Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Copy source
COPY . .

# Build the app
RUN npm run build


# 2) Serve stage
FROM nginx:1.27-alpine

# Copy built app
COPY --from=build /app/dist /usr/share/nginx/html

# Copy config template from public/ → nginx html dir
COPY public/config.js.template /usr/share/nginx/html/config.js.template

# Add entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.d/40-config.sh
RUN chmod +x /docker-entrypoint.d/40-config.sh

# Nginx config
RUN printf "server {\n\
  listen 80;\n\
  server_name _;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
\n\
  location / {\n\
    try_files \$uri \$uri/ /index.html;\n\
  }\n\
}\n" > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
