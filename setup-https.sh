#!/bin/bash

echo "Setting up HTTPS for CreatorX..."

# Create SSL directory in frontend
mkdir -p frontend/ssl

# Generate self-signed certificate
echo "Generating self-signed SSL certificate..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout frontend/ssl/key.pem \
  -out frontend/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=CreatorX/CN=44.215.164.169"

echo "SSL certificate generated!"

# Update frontend Dockerfile to include SSL
cat > frontend/Dockerfile.https << 'EOF'
# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Create SSL directory
RUN mkdir -p /etc/nginx/ssl

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy SSL certificates
COPY ssl/cert.pem /etc/nginx/ssl/cert.pem
COPY ssl/key.pem /etc/nginx/ssl/key.pem

# Copy nginx configuration for HTTPS
COPY nginx-https.conf /etc/nginx/conf.d/default.conf

# Expose ports 80 and 443
EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
EOF

# Update docker-compose to expose port 443
echo "
To complete the setup:

1. Update docker-compose.yml frontend ports to include 443:
   ports:
     - \"80:80\"
     - \"443:443\"

2. Update frontend Dockerfile name or use the new one:
   mv frontend/Dockerfile frontend/Dockerfile.bak
   mv frontend/Dockerfile.https frontend/Dockerfile

3. Rebuild and restart:
   sudo docker-compose up -d --build frontend

4. Update CORS in backend to include https://44.215.164.169

For production with a real domain:
1. Get a domain name and point it to 44.215.164.169
2. Run: sudo certbot --nginx -d yourdomain.com
"

echo "Setup files created! Follow the instructions above."
