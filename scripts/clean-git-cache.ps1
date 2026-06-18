# ==========================================
# Clean Git Cache - Remove Tracked Files (PowerShell)
# ==========================================
# This script removes files from Git cache that should be ignored
# Run this AFTER updating .gitignore

Write-Host "🧹 Cleaning Git Cache..." -ForegroundColor Cyan
Write-Host "This will remove tracked files that are now in .gitignore"
Write-Host ""

# Confirm before proceeding
$confirm = Read-Host "⚠️  Continue? (y/N)"
if ($confirm -notmatch '^[yY]$') {
    Write-Host "❌ Cancelled" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "📋 Removing files from Git cache..." -ForegroundColor Yellow
Write-Host ""

# Helper function
function Remove-GitCached {
    param($path)
    $result = git rm -r --cached $path 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Removed: $path" -ForegroundColor Green
    }
}

# Backend temp files
Write-Host "🔧 Backend temp files..." -ForegroundColor Cyan
Remove-GitCached "backend/scratch/"
Get-ChildItem -Path "backend" -Filter "*.json" -File | ForEach-Object {
    # Keep important files
    if ($_.Name -notin @("package.json", "package-lock.json", "tsconfig.json", "permissions_list.json", "coa_types.json")) {
        Remove-GitCached "backend/$($_.Name)"
    }
}
Get-ChildItem -Path "backend" -Filter "*.txt" -File | ForEach-Object {
    Remove-GitCached "backend/$($_.Name)"
}
Get-ChildItem -Path "backend" -Filter "*.cjs" -File | ForEach-Object {
    Remove-GitCached "backend/$($_.Name)"
}
Get-ChildItem -Path "backend" -Filter "*.mjs" -File | ForEach-Object {
    Remove-GitCached "backend/$($_.Name)"
}
Get-ChildItem -Path "backend" -Filter "*.error.log" -File | ForEach-Object {
    Remove-GitCached "backend/$($_.Name)"
}

# Public uploads/images
Write-Host "📁 Public uploads & images..." -ForegroundColor Cyan
Remove-GitCached "backend/public/images/"
Remove-GitCached "backend/public/uploads/"

# Frontend temp files
Write-Host "🎨 Frontend temp files..." -ForegroundColor Cyan
Get-ChildItem -Path "frontend" -Filter "*.cjs" -File | ForEach-Object {
    Remove-GitCached "frontend/$($_.Name)"
}
Get-ChildItem -Path "frontend" -Filter "*.mjs" -File | ForEach-Object {
    Remove-GitCached "frontend/$($_.Name)"
}
Remove-GitCached "frontend/tsc_output.txt"

# IDE & OS files
Write-Host "💻 IDE & OS files..." -ForegroundColor Cyan
Remove-GitCached ".vscode/"
Remove-GitCached ".idea/"
Remove-GitCached ".DS_Store"
Remove-GitCached "Thumbs.db"

# Node modules (if accidentally committed)
Write-Host "📦 Node modules..." -ForegroundColor Cyan
Remove-GitCached "node_modules/"
Remove-GitCached "backend/node_modules/"
Remove-GitCached "frontend/node_modules/"

# Environment files
Write-Host "🔒 Environment files..." -ForegroundColor Cyan
Remove-GitCached ".env"
Remove-GitCached ".env.local"
Remove-GitCached "backend/.env"
Remove-GitCached "frontend/.env"

# Documentation
Write-Host "📚 Documentation..." -ForegroundColor Cyan
Remove-GitCached ".gemini/"
Remove-GitCached ".qoder/"
Remove-GitCached "brain/"

Write-Host ""
Write-Host "✅ Git cache cleaned!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Review changes: git status"
Write-Host "2. Commit changes: git commit -m 'chore: update .gitignore and clean tracked files'"
Write-Host "3. Push to GitHub: git push"
Write-Host ""
Write-Host "⚠️  WARNING: Files will still exist locally, just removed from Git tracking" -ForegroundColor Red
