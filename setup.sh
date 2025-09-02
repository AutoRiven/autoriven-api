#!/bin/bash

echo "🚀 AutoRiven API Setup Script"
echo "=============================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v16+) first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file
if [ ! -f .env ]; then
    echo "🔧 Creating environment file..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your configuration"
else
    echo "ℹ️  Environment file already exists"
fi

# Build the application
echo "🔨 Building application..."
npm run build

echo ""
echo "✅ Setup completed!"
echo ""
echo "Next steps:"
echo "1. Update the .env file with your database and Elasticsearch configuration"
echo "2. Make sure PostgreSQL and Elasticsearch are running"
echo "3. Run 'npm run seed' to create initial users (optional)"
echo "4. Run 'npm run start:dev' to start the development server"
echo ""
echo "Default admin credentials (after running seed):"
echo "  Email: admin@autoriven.com"
echo "  Password: Admin@123"
echo ""
echo "API will be available at: http://localhost:3000/api"
echo "Health check: http://localhost:3000/api/health"
