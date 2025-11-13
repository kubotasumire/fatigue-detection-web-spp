#!/bin/bash
set -e

echo "🔨 Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "🔧 Installing backend dependencies..."
cd backend
npm install
cd ..

echo "✅ Build complete!"
