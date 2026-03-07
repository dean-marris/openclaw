# Optional: mission-control API image (Convex client + optional Express server).
# Build: docker build -t mission-control-api .
# Run with CONVEX_URL or CONVEX_DEPLOYMENT set (e.g. from host.docker.internal when Convex runs on host).
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY convex ./convex
COPY .env.local* ./
# Add server entry (e.g. server.js) and CMD when you add an API.
CMD ["npm", "run", "dev:once"]
