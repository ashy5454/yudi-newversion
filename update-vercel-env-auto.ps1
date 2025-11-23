# Automated Vercel Environment Variables Update for yudi-8bd6f Firebase project

Write-Host "Updating Vercel environment variables for yudi-8bd6f project..." -ForegroundColor Green
Write-Host "This will update all Firebase-related variables with correct values." -ForegroundColor Yellow
Write-Host ""

# Update NEXT_PUBLIC_FIREBASE_API_KEY
Write-Host "Updating NEXT_PUBLIC_FIREBASE_API_KEY..." -ForegroundColor Cyan
vercel env rm NEXT_PUBLIC_FIREBASE_API_KEY production --yes 2>$null
vercel env rm NEXT_PUBLIC_FIREBASE_API_KEY preview --yes 2>$null
vercel env rm NEXT_PUBLIC_FIREBASE_API_KEY development --yes 2>$null
echo "AIzaSyCJL0zm1lrejfzLQpZNiWExtjo_vT_l1zQ" | vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
echo "AIzaSyCJL0zm1lrejfzLQpZNiWExtjo_vT_l1zQ" | vercel env add NEXT_PUBLIC_FIREBASE_API_KEY preview
echo "AIzaSyCJL0zm1lrejfzLQpZNiWExtjo_vT_l1zQ" | vercel env add NEXT_PUBLIC_FIREBASE_API_KEY development

# Update NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
Write-Host "Updating NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN..." -ForegroundColor Cyan
vercel env rm NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production --yes 2>$null
vercel env rm NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN preview --yes 2>$null
vercel env rm NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN development --yes 2>$null
echo "yudi-8bd6f.firebaseapp.com" | vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production
echo "yudi-8bd6f.firebaseapp.com" | vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN preview
echo "yudi-8bd6f.firebaseapp.com" | vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN development

# Update NEXT_PUBLIC_FIREBASE_PROJECT_ID
Write-Host "Updating NEXT_PUBLIC_FIREBASE_PROJECT_ID..." -ForegroundColor Cyan
vercel env rm NEXT_PUBLIC_FIREBASE_PROJECT_ID production --yes 2>$null
vercel env rm NEXT_PUBLIC_FIREBASE_PROJECT_ID preview --yes 2>$null
vercel env rm NEXT_PUBLIC_FIREBASE_PROJECT_ID development --yes 2>$null
echo "yudi-8bd6f" | vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production
echo "yudi-8bd6f" | vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID preview
echo "yudi-8bd6f" | vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID development

# Update NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
Write-Host "Updating NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET..." -ForegroundColor Cyan
vercel env rm NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production --yes 2>$null
vercel env rm NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET preview --yes 2>$null
vercel env rm NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET development --yes 2>$null
echo "yudi-8bd6f.firebasestorage.app" | vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production
echo "yudi-8bd6f.firebasestorage.app" | vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET preview
echo "yudi-8bd6f.firebasestorage.app" | vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET development

# Update NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
Write-Host "Updating NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID..." -ForegroundColor Cyan
vercel env rm NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production --yes 2>$null
vercel env rm NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID preview --yes 2>$null
vercel env rm NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID development --yes 2>$null
echo "882569998626" | vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production
echo "882569998626" | vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID preview
echo "882569998626" | vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID development

# Update NEXT_PUBLIC_FIREBASE_APP_ID
Write-Host "Updating NEXT_PUBLIC_FIREBASE_APP_ID..." -ForegroundColor Cyan
vercel env rm NEXT_PUBLIC_FIREBASE_APP_ID production --yes 2>$null
vercel env rm NEXT_PUBLIC_FIREBASE_APP_ID preview --yes 2>$null
vercel env rm NEXT_PUBLIC_FIREBASE_APP_ID development --yes 2>$null
echo "1:882569998626:web:4669942f4304a1f2fb757b" | vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production
echo "1:882569998626:web:4669942f4304a1f2fb757b" | vercel env add NEXT_PUBLIC_FIREBASE_APP_ID preview
echo "1:882569998626:web:4669942f4304a1f2fb757b" | vercel env add NEXT_PUBLIC_FIREBASE_APP_ID development

# Update NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
Write-Host "Updating NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID..." -ForegroundColor Cyan
vercel env rm NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID production --yes 2>$null
vercel env rm NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID preview --yes 2>$null
vercel env rm NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID development --yes 2>$null
echo "G-1WDBCQ7PG4" | vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID production
echo "G-1WDBCQ7PG4" | vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID preview
echo "G-1WDBCQ7PG4" | vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID development

# Update FIREBASE_PROJECT_ID
Write-Host "Updating FIREBASE_PROJECT_ID..." -ForegroundColor Cyan
vercel env rm FIREBASE_PROJECT_ID production --yes 2>$null
vercel env rm FIREBASE_PROJECT_ID preview --yes 2>$null
vercel env rm FIREBASE_PROJECT_ID development --yes 2>$null
echo "yudi-8bd6f" | vercel env add FIREBASE_PROJECT_ID production
echo "yudi-8bd6f" | vercel env add FIREBASE_PROJECT_ID preview
echo "yudi-8bd6f" | vercel env add FIREBASE_PROJECT_ID development

Write-Host ""
Write-Host "All environment variables have been updated!" -ForegroundColor Green
Write-Host "Next step: Deploy to production with 'vercel --prod'" -ForegroundColor Yellow
