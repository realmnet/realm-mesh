#!/bin/bash

# Control Plane Development Environment Start Script

echo "🚀 Starting Control Plane development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if port 8080 is in use and kill the process if needed
CONTROL_PLANE_PORT=8080
if lsof -ti:$CONTROL_PLANE_PORT > /dev/null 2>&1; then
    echo "⚠️  Port $CONTROL_PLANE_PORT is already in use. Killing existing process..."
    PID=$(lsof -ti:$CONTROL_PLANE_PORT)
    kill -9 $PID 2>/dev/null
    sleep 2
    if lsof -ti:$CONTROL_PLANE_PORT > /dev/null 2>&1; then
        echo "❌ Failed to kill process on port $CONTROL_PLANE_PORT. Please check manually."
        echo "   Run: lsof -ti:$CONTROL_PLANE_PORT | xargs kill -9"
        exit 1
    else
        echo "✅ Process on port $CONTROL_PLANE_PORT killed successfully."
    fi
fi

# Start the services
docker-compose -f ./dev/control-plane/docker-compose.dev.yml up -d

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Check if PostgreSQL is ready
until docker exec control-plane-postgres pg_isready -U control_plane_user -d control_plane_db > /dev/null 2>&1; do
    echo "⏳ Waiting for PostgreSQL..."
    sleep 2
done

echo "✅ PostgreSQL is ready!"
echo ""
echo "📋 Development Environment Info:"
echo "   PostgreSQL: localhost:5432"
echo "   Database: control_plane_db"
echo "   Username: control_plane_user"
echo "   PgAdmin: http://localhost:5050 (admin@control-plane.local / admin)"
echo ""
echo "🎯 To start the Control Plane service:"
echo "   cd ../../infra/control-plane"
echo "   ./gradlew bootRun"
echo ""
echo "🛑 To stop: ./stop.sh"