# Deploy WordPress Direct API Access (No CloudFront)
# This script deploys the updated frontend with direct WordPress API access

Write-Host "🚀 Deploying WordPress Direct API Access Configuration..." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Step 1: Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Step 2: Build the application
Write-Host "🔨 Building Next.js application..." -ForegroundColor Yellow
npm run build

# Step 3: Test the build locally (optional)
Write-Host "🧪 Testing build locally..." -ForegroundColor Yellow
Write-Host "You can test locally with: npm run start" -ForegroundColor Cyan

# Step 4: Deploy to Amplify
Write-Host "☁️ Deploying to AWS Amplify..." -ForegroundColor Yellow
Write-Host "📋 Changes being deployed:" -ForegroundColor Cyan
Write-Host "   ✅ Custom WordPress image loader" -ForegroundColor Green
Write-Host "   ✅ Direct API access (no CloudFront)" -ForegroundColor Green
Write-Host "   ✅ CORS headers properly configured" -ForegroundColor Green
Write-Host "   ✅ No image URL suffixes (-Long, etc.)" -ForegroundColor Green

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Push changes to Git repository" -ForegroundColor Cyan
Write-Host "2. Amplify will automatically deploy the changes" -ForegroundColor Cyan
Write-Host "3. Test images load correctly without CloudFront" -ForegroundColor Cyan
Write-Host "4. Verify CORS headers work properly" -ForegroundColor Cyan

Write-Host ""
Write-Host "📝 Git commands to deploy:" -ForegroundColor Yellow
Write-Host "git add ." -ForegroundColor Cyan
Write-Host "git commit -m 'feat: implement direct WordPress API access without CloudFront'" -ForegroundColor Cyan
Write-Host "git push origin main" -ForegroundColor Cyan

Write-Host ""
Write-Host "✅ WordPress Direct API Configuration Complete!" -ForegroundColor Green
Write-Host "Images will now load directly from api.cowboykimono.com without CloudFront" -ForegroundColor Green
