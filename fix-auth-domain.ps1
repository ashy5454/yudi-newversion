# Fix Firebase Auth Domain variable without newlines

$authDomain = "yudi-8bd6f.firebaseapp.com"

# Production
Write-Host "Setting NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN for production..." -ForegroundColor Cyan
$authDomain | vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production

# Preview
Write-Host "Setting NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN for preview..." -ForegroundColor Cyan
$authDomain | vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN preview

# Development
Write-Host "Setting NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN for development..." -ForegroundColor Cyan
$authDomain | vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN development

Write-Host ""
Write-Host "Auth domain updated successfully!" -ForegroundColor Green
Write-Host "Deploying to production..." -ForegroundColor Yellow
