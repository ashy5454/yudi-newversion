#!/bin/bash
# Script to run backend server

cd backend

# Activate virtual environment
if [ -d "venv" ]; then
    echo "✅ Activating virtual environment..."
    source venv/bin/activate
else
    echo "❌ Virtual environment not found!"
    echo "Creating one..."
    python3 -m venv venv
    source venv/bin/activate
    echo "Installing dependencies..."
    pip install -r requirements.txt
fi

# Check if Python is available
if command -v python &> /dev/null; then
    echo "✅ Python found in venv"
    python --version
else
    echo "⚠️  Using python3 instead..."
    python3 --version
fi

# Run the server
echo ""
echo "🚀 Starting Flask backend server on port 5002..."
echo "   (Press Ctrl+C to stop)"
echo ""

# Use python if available in venv, otherwise python3
if command -v python &> /dev/null; then
    PORT=5002 python main.py
else
    PORT=5002 python3 main.py
fi

