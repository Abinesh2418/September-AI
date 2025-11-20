#!/bin/bash

echo "🎯 Starting Feature-2: Gmail Ticket System"
echo "=========================================="

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found! Run ./install.sh first"
    exit 1
fi

# Check if Python packages are installed
echo "📋 Checking dependencies..."
python3 -c "import requests, fastapi, uvicorn" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "❌ Required packages not installed. Run ./install.sh first"
    exit 1
fi

echo "✅ All dependencies ready"
echo ""

# Show what will be started
echo "🚀 Starting services:"
echo "   📊 Web Dashboard: http://localhost:8000"
echo "   📧 Gmail Monitor: sharang.23ad@kct.ac.in"
echo "   🎫 Ticket Creation: Automatic from employee emails"
echo "   👥 Staff Routing: IT roles configured in .env"
echo ""

# Start dashboard in background
echo "📊 Starting Web Dashboard..."
python3 ticket_dashboard.py &
DASHBOARD_PID=$!

# Wait a moment for dashboard to start
sleep 3

# Check if dashboard started successfully
if ps -p $DASHBOARD_PID > /dev/null; then
    echo "✅ Dashboard started (PID: $DASHBOARD_PID)"
    echo "🌐 Open: http://localhost:8000"
else
    echo "❌ Dashboard failed to start"
    exit 1
fi

echo ""
echo "🎯 System is running!"
echo "================================"
echo "📊 Dashboard: http://localhost:8000"
echo "📧 Monitoring: Gmail inbox automatically"
echo "🎫 Creating tickets from employee emails"
echo "👥 Routing to appropriate staff members"
echo ""
echo "💡 Test the system:"
echo "   1. Send an email to: sharang.23ad@kct.ac.in"
echo "   2. Watch the dashboard for new tickets"
echo "   3. Use 'Simulate Email' button for testing"
echo ""
echo "🛑 Press Ctrl+C to stop all services"
echo "================================"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $DASHBOARD_PID 2>/dev/null
    echo "👋 Feature-2 system stopped"
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM

# Keep script running
while true; do
    sleep 1
done