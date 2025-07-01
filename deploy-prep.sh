#!/bin/bash

# Deployment preparation script for AWS Amplify
# Run this script before pushing to GitHub

echo "🚀 Preparing Cowboy Kimonos website for AWS Amplify deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run linting
echo "🔍 Running linter..."
npm run lint

# Test build locally
echo "🏗️  Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Commit your changes: git add . && git commit -m 'Prepare for deployment'"
    echo "2. Push to GitHub: git push origin main"
    echo "3. Set up AWS Amplify to connect to your GitHub repository"
    echo "4. Amplify will automatically use the amplify.yml configuration"
    echo ""
    echo "🎉 Your site is ready for deployment!"
else
    echo "❌ Build failed. Please fix the errors before deploying."
    exit 1
fi
