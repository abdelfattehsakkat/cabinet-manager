# Stage 1: builder - installs deps and exports static web files using Expo
# Production-ready multi-stage Dockerfile for front2 (Expo web)
# Stage 2: serve - uses nginx to serve the exported static files

### Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Install build dependencies
COPY package.json package-lock.json* ./
RUN npm ci --silent || npm install --silent

# Copy source
COPY . .

# Ensure non-interactive environment
ENV CI=true

# Export static web assets using expo export with web platform
# Use --output-dir to put files into web-build
RUN npx expo export --output-dir web-build -p web

### Runner
FROM nginx:alpine AS runner


# Remove default nginx index and copy built web assets
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/web-build /usr/share/nginx/html

# Create a minimal nginx config for SPA fallback (written at build time)
RUN mkdir -p /etc/nginx/conf.d && \
	printf '%s\n' \
	  'server {' \
	  '  listen 80;' \
	  '  server_name _;' \
	  '' \
	  '  root /usr/share/nginx/html;' \
	  '  index index.html;' \
	  '' \
	  '  location / {' \
	  '    try_files $uri $uri/ /index.html;' \
	  '  }' \
	  '' \
	  '  location /static/ {' \
	  '    expires 1y;' \
	  '    add_header Cache-Control "public";' \
	  '  }' \
	  '}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

