#!/bin/bash
# ==========================================
# Clean Git Cache - Remove Tracked Files
# ==========================================
# This script removes files from Git cache that should be ignored
# Run this AFTER updating .gitignore

echo "🧹 Cleaning Git Cache..."
echo "This will remove tracked files that are now in .gitignore"
echo ""

# Confirm before proceeding
read -p "⚠️  Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelled"
    exit 1
fi

echo ""
echo "📋 Removing files from Git cache..."
echo ""

# Backend temp files
echo "🔧 Backend temp files..."
git rm -r --cached backend/scratch/ 2>/dev/null || true
git rm --cached backend/*.json 2>/dev/null || true
git rm --cached backend/*.txt 2>/dev/null || true
git rm --cached backend/*.cjs 2>/dev/null || true
git rm --cached backend/*.mjs 2>/dev/null || true
git rm --cached backend/*.error.log 2>/dev/null || true

# Re-add important JSON files
git add --force backend/package.json 2>/dev/null || true
git add --force backend/package-lock.json 2>/dev/null || true
git add --force backend/tsconfig.json 2>/dev/null || true

# Public uploads/images
echo "📁 Public uploads & images..."
git rm -r --cached backend/public/images/ 2>/dev/null || true
git rm -r --cached backend/public/uploads/ 2>/dev/null || true

# Frontend temp files
echo "🎨 Frontend temp files..."
git rm --cached frontend/*.cjs 2>/dev/null || true
git rm --cached frontend/*.mjs 2>/dev/null || true
git rm --cached frontend/tsc_output.txt 2>/dev/null || true

# IDE & OS files
echo "💻 IDE & OS files..."
git rm -r --cached .vscode/ 2>/dev/null || true
git rm -r --cached .idea/ 2>/dev/null || true
git rm --cached .DS_Store 2>/dev/null || true
git rm --cached Thumbs.db 2>/dev/null || true

# Node modules (if accidentally committed)
echo "📦 Node modules..."
git rm -r --cached node_modules/ 2>/dev/null || true
git rm -r --cached backend/node_modules/ 2>/dev/null || true
git rm -r --cached frontend/node_modules/ 2>/dev/null || true

# Environment files
echo "🔒 Environment files..."
git rm --cached .env 2>/dev/null || true
git rm --cached .env.local 2>/dev/null || true
git rm --cached backend/.env 2>/dev/null || true
git rm --cached frontend/.env 2>/dev/null || true

# Documentation
echo "📚 Documentation..."
git rm -r --cached .gemini/ 2>/dev/null || true
git rm -r --cached .qoder/ 2>/dev/null || true
git rm -r --cached brain/ 2>/dev/null || true

echo ""
echo "✅ Git cache cleaned!"
echo ""
echo "📋 Next steps:"
echo "1. Review changes: git status"
echo "2. Commit changes: git commit -m 'chore: update .gitignore and clean tracked files'"
echo "3. Push to GitHub: git push"
echo ""
echo "⚠️  WARNING: Files will still exist locally, just removed from Git tracking"
