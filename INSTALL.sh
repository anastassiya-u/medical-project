#!/bin/bash
# Oracle vs. Critic Experiment - MacOS Installation Script
# Apple Silicon (M1/M2/M3) Optimized

set -e  # Exit on error

echo "🚀 Oracle vs. Critic Experiment - Installation"
echo "=============================================="
echo ""

# Check system architecture
ARCH=$(uname -m)
echo "✓ Architecture detected: $ARCH"

if [ "$ARCH" != "arm64" ]; then
    echo "⚠️  Warning: This script is optimized for Apple Silicon (arm64)"
    echo "   Your system is: $ARCH"
fi
echo ""

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found"
    echo ""
    echo "Please install Node.js first:"
    echo "  brew install node@20"
    echo ""
    echo "Or download from: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✓ Node.js found: $NODE_VERSION"
echo ""

# Check npm
NPM_VERSION=$(npm --version)
echo "✓ npm found: v$NPM_VERSION"
echo ""

# Navigate to project directory
PROJECT_DIR="/Users/anastassiya/Desktop/Demo project"
cd "$PROJECT_DIR" || exit 1
echo "✓ Project directory: $PROJECT_DIR"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found"
    echo ""
    echo "Creating from template..."
    cp .env.example .env.local
    echo "✓ Created .env.local"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env.local with your Supabase credentials!"
    echo "   1. Open Supabase Dashboard → Settings → API"
    echo "   2. Copy Project URL and Anon Key"
    echo "   3. Edit .env.local:"
    echo "      nano .env.local"
    echo ""
    read -p "Press Enter when you've updated .env.local..."
else
    echo "✓ .env.local exists"
fi
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
echo "   This may take 2-3 minutes..."
echo ""
npm install

echo ""
echo "✅ Installation complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 NEXT STEPS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Initialize Supabase Database:"
echo "   cat supabase/schema.sql | pbcopy"
echo "   # Then paste into Supabase SQL Editor and Run"
echo ""
echo "2. Start development server:"
echo "   npm run dev"
echo ""
echo "3. Open in browser:"
echo "   http://localhost:3000"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "For detailed guide, see: MAC_SETUP.md"
echo ""
