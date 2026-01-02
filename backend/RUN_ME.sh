#!/bin/bash
echo "🚀 Starting Yudi Chat..."
echo ""
echo "✅ Step 1: Checking .env file..."
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create .env file with required variables (see QUICKSTART.md)"
    exit 1
fi
echo "✅ .env file exists"
echo ""
echo "✅ Step 2: Starting Next.js dev server..."
echo "📱 App will open at: http://localhost:3000"
echo ""
npm run dev
