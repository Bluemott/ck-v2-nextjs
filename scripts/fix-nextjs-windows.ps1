# Fix Next.js Windows Issues Script
# This script helps resolve common Windows-specific Next.js issues

Write-Host "🔧 Fixing Next.js Windows Issues..." -ForegroundColor Yellow

# Check if we're in a Next.js project
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Not in a Next.js project directory" -ForegroundColor Red
    exit 1
}

# Check if Next.js is installed
$packageJson = Get-Content "package.json" | ConvertFrom-Json
if (-not ($packageJson.dependencies.next -or $packageJson.devDependencies.next)) {
    Write-Host "❌ Error: Next.js not found in package.json" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Next.js project detected" -ForegroundColor Green

# Remove problematic .next directory
if (Test-Path ".next") {
    Write-Host "🗑️  Removing .next directory..." -ForegroundColor Yellow
    try {
        Remove-Item -Recurse -Force .next -ErrorAction Stop
        Write-Host "✅ .next directory removed successfully" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Warning: Could not remove .next directory: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "   You may need to close any running processes first" -ForegroundColor Yellow
    }
} else {
    Write-Host "ℹ️  .next directory not found (already cleaned)" -ForegroundColor Blue
}

# Clear npm cache if needed
Write-Host "🧹 Clearing npm cache..." -ForegroundColor Yellow
npm cache clean --force

# Reinstall dependencies
Write-Host "📦 Reinstalling dependencies..." -ForegroundColor Yellow
npm install

# Build the project
Write-Host "🔨 Building project..." -ForegroundColor Yellow
npm run build

Write-Host "✅ Next.js Windows issues should be resolved!" -ForegroundColor Green
Write-Host "🚀 You can now run 'npm run dev' to start the development server" -ForegroundColor Green 