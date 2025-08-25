# 1) Build stage
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci || npm install

COPY . .
RUN npm run build

# 2) Serve stage
FROM nginx:alpine

# Copy built files to nginx html
COPY --from=build /app/dist /usr/share/nginx/html

# Copy config template from public/
COPY public/config.js.template /usr/share/nginx/html/config.js.template

# Add entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Custom nginx config
RUN printf "server {\n\
  listen 80;\n\
  server_name _;\n\
  root /usr/share/nginx/html;\n\
  index index.html;\n\
  location / {\n\
    try_files \$uri \$uri/ /index.html;\n\
  }\n\
  location /config.js {\n\
    add_header Content-Type application/javascript;\n\
    try_files /config.js =404;\n\
  }\n\
}\n" > /etc/nginx/conf.d/default.conf

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
