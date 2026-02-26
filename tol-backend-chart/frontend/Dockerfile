# Stage 1: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config for SPA (React Router)
RUN cat > /etc/nginx/conf.d/default.conf << 'NGINX'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check
    location /nginx-health {
        return 200 'ok';
        add_header Content-Type text/plain;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|ico|svg|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Don't cache index.html or config.js
    location ~* (index\.html|config\.js)$ {
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy no-referrer;
}
NGINX

EXPOSE 80
