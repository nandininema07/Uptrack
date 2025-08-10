# PowerShell Deployment Script for Habit Tracker App
# Run this script from the project root directory

Write-Host "🚀 Habit Tracker App Deployment Script" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Check if Vercel CLI is installed
try {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI found: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
}

# Build the project
Write-Host "🔨 Building the project..." -ForegroundColor Blue
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed. Please fix the errors and try again." -ForegroundColor Red
    exit 1
}

# Check if user is logged in to Vercel
Write-Host "🔐 Checking Vercel login status..." -ForegroundColor Blue
try {
    $vercelUser = vercel whoami
    Write-Host "✅ Logged in as: $vercelUser" -ForegroundColor Green
} catch {
    Write-Host "❌ Not logged in to Vercel. Please login first:" -ForegroundColor Yellow
    Write-Host "   vercel login" -ForegroundColor Cyan
    exit 1
}

# Deploy to Vercel
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Blue
Write-Host "   This will open a browser window for configuration." -ForegroundColor Yellow
Write-Host "   Choose 'Y' when asked to override settings." -ForegroundColor Yellow

vercel --prod

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Set environment variables in Vercel dashboard:" -ForegroundColor White
    Write-Host "      - VITE_API_BASE_URL: Your backend URL" -ForegroundColor White
    Write-Host "      - VITE_VAPID_PUBLIC_KEY: Your VAPID public key" -ForegroundColor White
    Write-Host "   2. Deploy your backend to Railway or similar platform" -ForegroundColor White
    Write-Host "   3. Update VITE_API_BASE_URL with your backend URL" -ForegroundColor White
    Write-Host ""
    Write-Host "🔗 View your deployment: vercel ls" -ForegroundColor Cyan
} else {
    Write-Host "❌ Deployment failed. Please check the error messages above." -ForegroundColor Red
}
