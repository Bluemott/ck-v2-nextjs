@echo off
echo 🚀 Preparing Cowboy Kimonos website for AWS Amplify deployment...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the project root.
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
call npm ci

REM Run linting
echo 🔍 Running linter...
call npm run lint

REM Test build locally
echo 🏗️ Testing build...
call npm run build

if %errorlevel% equ 0 (
    echo ✅ Build successful!
    echo.
    echo 📝 Next steps:
    echo 1. Commit your changes: git add . ^&^& git commit -m "Prepare for deployment"
    echo 2. Push to GitHub: git push origin main
    echo 3. Set up AWS Amplify to connect to your GitHub repository
    echo 4. Amplify will automatically use the amplify.yml configuration
    echo.
    echo 🎉 Your site is ready for deployment!
) else (
    echo ❌ Build failed. Please fix the errors before deploying.
    exit /b 1
)

pause
