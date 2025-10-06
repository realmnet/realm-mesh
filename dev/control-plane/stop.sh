#!/bin/bash

# Control Plane Development Environment Stop Script

echo "🛑 Stopping Control Plane development environment..."

docker-compose -f docker-compose.dev.yml down

echo "✅ Control Plane development environment stopped."
echo "💡 To remove all data: docker-compose -f docker-compose.dev.yml down -v"