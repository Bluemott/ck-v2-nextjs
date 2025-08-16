# Fix Admin CloudFront Distribution Script
# This script helps manually update the CloudFront distribution for admin.cowboykimono.com
# to fix the WordPress admin login issue by removing X-Forwarded-Host headers

Write-Host "🔧 Fixing Admin CloudFront Distribution..." -ForegroundColor Green
Write-Host ""

# CloudFront Distribution ID for admin.cowboykimono.com
$DISTRIBUTION_ID = "ESC0JXOXVWX4J"

Write-Host "📋 Distribution Details:" -ForegroundColor Cyan
Write-Host "  • Distribution ID: $DISTRIBUTION_ID" -ForegroundColor White
Write-Host "  • Domain: admin.cowboykimono.com" -ForegroundColor White
Write-Host "  • Origin: wp-origin.cowboykimono.com" -ForegroundColor White
Write-Host ""

Write-Host "🔍 Current Configuration:" -ForegroundColor Yellow
aws cloudfront get-distribution-config --id $DISTRIBUTION_ID --query "DistributionConfig.Origins.Items[0].{Id:Id,DomainName:DomainName,CustomHeaders:CustomHeaders}" --output table

Write-Host ""
Write-Host "⚠️  IMPORTANT: Manual Steps Required" -ForegroundColor Red
Write-Host ""
Write-Host "To fix the WordPress admin login issue, you need to manually update the CloudFront distribution:" -ForegroundColor White
Write-Host ""
Write-Host "1. Go to AWS Console → CloudFront → Distributions" -ForegroundColor White
Write-Host "2. Find distribution ID: $DISTRIBUTION_ID" -ForegroundColor White
Write-Host "3. Click 'Edit' → 'Origins' tab" -ForegroundColor White
Write-Host "4. Edit the origin for wp-origin.cowboykimono.com" -ForegroundColor White
Write-Host "5. In 'Origin custom headers', REMOVE the 'X-Forwarded-Host' header" -ForegroundColor White
Write-Host "6. Keep only 'X-Forwarded-Proto: https'" -ForegroundColor White
Write-Host "7. Save changes and wait for deployment (5-10 minutes)" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Alternative: Use AWS CLI to update (requires distribution config file)" -ForegroundColor Cyan
Write-Host ""

Write-Host "📝 Expected Changes:" -ForegroundColor Cyan
Write-Host "  • Remove: X-Forwarded-Host: admin.cowboykimono.com" -ForegroundColor White
Write-Host "  • Keep: X-Forwarded-Proto: https" -ForegroundColor White
Write-Host "  • Origin: wp-origin.cowboykimono.com" -ForegroundColor White
Write-Host ""

Write-Host "🎯 Root Cause:" -ForegroundColor Cyan
Write-Host "  • CloudFront was sending X-Forwarded-Host: admin.cowboykimono.com" -ForegroundColor White
Write-Host "  • This caused WordPress to redirect back to admin.cowboykimono.com" -ForegroundColor White
Write-Host "  • Creating a redirect loop that broke cookies/sessions" -ForegroundColor White
Write-Host ""

Write-Host "✅ After making these changes:" -ForegroundColor Green
Write-Host "  1. Wait 5-10 minutes for CloudFront to deploy" -ForegroundColor White
Write-Host "  2. Clear browser cache and cookies for admin.cowboykimono.com" -ForegroundColor White
Write-Host "  3. Test admin access: https://admin.cowboykimono.com/wp-admin" -ForegroundColor White
Write-Host ""

Write-Host "🔗 AWS Console Link:" -ForegroundColor Cyan
Write-Host "  https://console.aws.amazon.com/cloudfront/v3/home#/distributions/$DISTRIBUTION_ID" -ForegroundColor White
Write-Host ""

Write-Host "🎉 Manual fix instructions provided!" -ForegroundColor Green
Write-Host "Please follow the steps above to update the CloudFront distribution." -ForegroundColor White
