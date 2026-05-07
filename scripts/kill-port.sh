#!/bin/bash

# Script to kill process on a specific port
# Usage: ./scripts/kill-port.sh [PORT]
# Example: ./scripts/kill-port.sh 5033

PORT=${1:-5033}

echo "🔍 Checking for processes on port $PORT..."

PID=$(lsof -nP -tiTCP:$PORT -sTCP:LISTEN)

if [ -z "$PID" ]; then
    echo "✅ Port $PORT is free - no process found"
    exit 0
fi

echo "📋 Found process(es) using port $PORT:"
ps -p $PID -o pid,comm,args

echo ""
read -p "⚠️  Kill process(es) on port $PORT? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    kill $PID
    sleep 1
    
    # Check if still running
    if lsof -ti:$PORT > /dev/null 2>&1; then
        echo "⚠️  Process still running, forcing kill..."
        kill -9 $PID
    fi
    
    echo "✅ Port $PORT is now free"
else
    echo "❌ Cancelled"
    exit 1
fi
