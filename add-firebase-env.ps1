# Add Firebase environment variables cleanly without any newlines

Write-Host "Removing all existing Firebase environment variables..." -ForegroundColor Yellow

# Remove all Firebase env vars from all environments
$envVars = @(
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
    "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID",
    "FIREBASE_PROJECT_ID"
)

foreach ($var in $envVars) {
    Write-Host "Removing $var..." -ForegroundColor Gray
    vercel env rm $var production --yes 2>$null
    vercel env rm $var preview --yes 2>$null
    vercel env rm $var development --yes 2>$null
}

Write-Host "`nAdding Firebase environment variables cleanly..." -ForegroundColor Green

# Add variables using direct string input (no files, no pipes)
Write-Host "Adding NEXT_PUBLIC_FIREBASE_API_KEY..." -ForegroundColor Cyan
"AIzaSyCJL0zm1lrejfzLQpZNiWExtjo_vT_l1zQ" | vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
"AIzaSyCJL0zm1lrejfzLQpZNiWExtjo_vT_l1zQ" | vercel env add NEXT_PUBLIC_FIREBASE_API_KEY preview
"AIzaSyCJL0zm1lrejfzLQpZNiWExtjo_vT_l1zQ" | vercel env add NEXT_PUBLIC_FIREBASE_API_KEY development

Write-Host "Adding NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN..." -ForegroundColor Cyan
"yudi-8bd6f.firebaseapp.com" | vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production
"yudi-8bd6f.firebaseapp.com" | vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN preview
"yudi-8bd6f.firebaseapp.com" | vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN development

Write-Host "Adding NEXT_PUBLIC_FIREBASE_PROJECT_ID..." -ForegroundColor Cyan
"yudi-8bd6f" | vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production
"yudi-8bd6f" | vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID preview
"yudi-8bd6f" | vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID development

Write-Host "Adding NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET..." -ForegroundColor Cyan
"yudi-8bd6f.firebasestorage.app" | vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production
"yudi-8bd6f.firebasestorage.app" | vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET preview
"yudi-8bd6f.firebasestorage.app" | vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET development

Write-Host "Adding NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID..." -ForegroundColor Cyan
"882569998626" | vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production
"882569998626" | vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID preview
"882569998626" | vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID development

Write-Host "Adding NEXT_PUBLIC_FIREBASE_APP_ID..." -ForegroundColor Cyan
"1:882569998626:web:4669942f4304a1f2fb757b" | vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production
"1:882569998626:web:4669942f4304a1f2fb757b" | vercel env add NEXT_PUBLIC_FIREBASE_APP_ID preview
"1:882569998626:web:4669942f4304a1f2fb757b" | vercel env add NEXT_PUBLIC_FIREBASE_APP_ID development

Write-Host "Adding NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID..." -ForegroundColor Cyan
"G-1WDBCQ7PG4" | vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID production
"G-1WDBCQ7PG4" | vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID preview
"G-1WDBCQ7PG4" | vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID development

Write-Host "Adding FIREBASE_PROJECT_ID..." -ForegroundColor Cyan
"yudi-8bd6f" | vercel env add FIREBASE_PROJECT_ID production
"yudi-8bd6f" | vercel env add FIREBASE_PROJECT_ID preview
"yudi-8bd6f" | vercel env add FIREBASE_PROJECT_ID development

Write-Host "`n✅ All Firebase environment variables added successfully!" -ForegroundColor Green
Write-Host "Next step: Deploy to production with 'vercel --prod'" -ForegroundColor Yellow
