# Set Firebase Auth Domain cleanly for all environments

$authDomain = "yudi-8bd6f.firebaseapp.com"

Write-Host "Adding NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN to all environments..." -ForegroundColor Green
Write-Host "Value: $authDomain" -ForegroundColor Cyan
Write-Host ""

# Add to production
Write-Host "Adding to production..." -ForegroundColor Yellow
Write-Output $authDomain.Trim() | vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production

# Add to preview
Write-Host "Adding to preview..." -ForegroundColor Yellow
Write-Output $authDomain.Trim() | vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN preview

# Add to development
Write-Host "Adding to development..." -ForegroundColor Yellow
Write-Output $authDomain.Trim() | vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN development

Write-Host ""
Write-Host "Auth domain added successfully to all environments!" -ForegroundColor Green
