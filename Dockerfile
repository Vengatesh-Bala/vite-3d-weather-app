# 1) Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Copy source and build
COPY . .
RUN npm run build

# 2) Serve stage
FROM nginx:1.27-alpine

# Copy build output
COPY --from=build /app/dist /usr/share/nginx/html

# Install envsubst (for replacing placeholders) + bash
RUN apk add --no-cache gettext bash

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
