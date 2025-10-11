#!/bin/bash

# Gateway Development Startup Script
# Initializes Prisma schema and starts the gateway
# Note: Database should already be running (started by Makefile)

echo "🚀 Starting RealmMesh Gateway Development Environment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists, if not copy from example
if [ ! -f .env ]; then
    echo -e "${YELLOW}📋 Creating .env from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created${NC}"
fi

# Initialize Prisma and push schema
echo -e "${YELLOW}🔄 Initializing Prisma schema...${NC}"
npm run db:init

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Prisma schema initialized${NC}"
else
    echo -e "${RED}❌ Failed to initialize Prisma schema${NC}"
    exit 1
fi

# Start the gateway
echo -e "${YELLOW}🚀 Starting Gateway Server...${NC}"
echo ""
echo "📊 Database: postgresql://localhost:5433/gateway_db"
echo "🔧 PgAdmin: http://localhost:5051 (admin@gateway.local / admin)"
echo "🌐 Internal Gateway: ws://localhost:8080"
echo "🔒 External Gateway: ws://localhost:8443"
echo "🛠  Admin API: http://localhost:3001"
echo ""

# Start the gateway with nodemon for hot reload
npm run dev