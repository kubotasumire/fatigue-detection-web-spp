#!/bin/bash
set -e

echo "📍 Current directory: $(pwd)"
echo "📂 Directory contents:"
ls -la

echo ""
echo "🔨 Building frontend..."
cd frontend
echo "📍 Frontend directory: $(pwd)"
npm install --legacy-peer-deps
npm run build
echo "✅ Frontend build complete"
ls -la build/ || echo "⚠️  No build directory found!"

cd ..
echo "📍 Back to root: $(pwd)"

echo ""
echo "🔧 Installing backend dependencies..."
cd backend
echo "📍 Backend directory: $(pwd)"
npm install
echo "✅ Backend install complete"

cd ..
echo "📍 Back to root: $(pwd)"

echo ""
echo "✅ All build steps complete!"
echo "📂 Final structure:"
find . -name "index.html" -o -name "server.js" | head -10
