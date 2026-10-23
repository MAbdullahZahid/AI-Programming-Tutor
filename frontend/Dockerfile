# ── AI Programming Tutor ── Frontend Dockerfile ──────────────────────────
# React + Vite — multi-stage build (build → nginx serve)

# ── Stage 1: Build React app ────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Pass the backend API URL as a build arg (override when deploying to EC2)
ARG VITE_API_BASE_URL=http://localhost:5000/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Serve with nginx ────────────────────────────────────────────
FROM nginx:alpine

# Copy built React files to nginx's web root
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config for React Router (handle client-side routes)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

