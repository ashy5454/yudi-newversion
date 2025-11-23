# PowerShell script to add environment variables to Vercel
# Run this script to add all environment variables at once

Write-Host "Adding environment variables to Vercel..." -ForegroundColor Green
Write-Host "You'll need to paste the value when prompted for each variable.`n" -ForegroundColor Yellow

# Add environment variables one by one
Write-Host "Adding GEMINI_API_KEY..." -ForegroundColor Cyan
vercel env add GEMINI_API_KEY production

Write-Host "`nAdding GOOGLE_PROJECT_ID..." -ForegroundColor Cyan
vercel env add GOOGLE_PROJECT_ID production

Write-Host "`nAdding GOOGLE_PROJECT_LOCATION..." -ForegroundColor Cyan
vercel env add GOOGLE_PROJECT_LOCATION production

Write-Host "`nAdding NEXT_PUBLIC_FIREBASE_API_KEY..." -ForegroundColor Cyan
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production

Write-Host "`nAdding NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN..." -ForegroundColor Cyan
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production

Write-Host "`nAdding NEXT_PUBLIC_FIREBASE_PROJECT_ID..." -ForegroundColor Cyan
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production

Write-Host "`nAdding NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET..." -ForegroundColor Cyan
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production

Write-Host "`nAdding NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID..." -ForegroundColor Cyan
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production

Write-Host "`nAdding NEXT_PUBLIC_FIREBASE_APP_ID..." -ForegroundColor Cyan
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production

Write-Host "`nAdding NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID..." -ForegroundColor Cyan
vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID production

Write-Host "`nDone! All environment variables have been added." -ForegroundColor Green
Write-Host "Now run: vercel --prod" -ForegroundColor Cyan
