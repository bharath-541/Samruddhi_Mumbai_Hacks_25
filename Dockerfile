# Multi-stage production-ready Dockerfile for Samruddhi Backend
# Supports Node.js (TypeScript) + Python (ML predictions)

FROM node:20-slim AS base

# Install Python 3 and build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy Python requirements
COPY requirements.txt ./

# Install Python dependencies (container-safe)
RUN pip3 install --no-cache-dir -r requirements.txt --break-system-packages

# Copy source code
COPY src ./src
COPY scripts ./scripts

# Build TypeScript code
RUN npm run build

# Expose the port
EXPOSE 3000

# Health check (Render uses this)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health/live || exit 1

# Environment variables (defaults, override in deployment)
ENV PORT=3000
ENV NODE_ENV=production
ENV LOG_LEVEL=info

# Start the server
CMD ["node", "dist/server.js"]

