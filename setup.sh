#!/bin/bash
# Marris OpenClaw — setup script
# Run this after cloning or when node_modules/.venv are missing

set -e
REPO="$(cd "$(dirname "$0")" && pwd)"

echo "📦 Installing mission-control dependencies..."
cd "$REPO/mission-control"
npm install

echo "📦 Installing dashboard dependencies..."
cd "$REPO/mission-control/dashboard"
npm install

echo "🐍 Setting up Python scripts environment..."
cd "$REPO/mission-control/scripts"
uv sync 2>/dev/null || echo "  (uv not installed — skipping Python setup)"

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start:"
echo "  Convex:    cd mission-control && npm run dev"
echo "  Dashboard: cd mission-control/dashboard && npm run dev"
