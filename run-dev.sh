#!/bin/bash

# Script to run both Backend and Frontend
# Usage: ./run-dev.sh

echo "🚀 Starting TijarahJo Development Servers..."
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Start Backend
echo "📦 Starting Backend (ASP.NET Core) on http://localhost:5033..."
cd "TijarahJo-Backend/TijarahJoDBAPI/TijarahJoDBAPI"
dotnet run &
BACKEND_PID=$!
cd ../../..

# Wait a bit for backend to start
sleep 3

# Start Frontend
echo "⚛️  Starting Frontend (Vite) on http://localhost:5173..."
cd "TijarahJo-frontend"
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Both servers are starting..."
echo "📡 Backend API: http://localhost:5033"
echo "🌐 Frontend: http://localhost:5173"
echo "📚 Swagger: http://localhost:5033/swagger"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait

