# Update Vercel Environment Variables for yudi-8bd6f Firebase project

Write-Host "Updating Vercel environment variables for yudi-8bd6f project..." -ForegroundColor Green

# Frontend (Client) Variables
vercel env rm NEXT_PUBLIC_FIREBASE_API_KEY production --yes
vercel env rm NEXT_PUBLIC_FIREBASE_API_KEY preview --yes
vercel env rm NEXT_PUBLIC_FIREBASE_API_KEY development --yes
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production preview development

vercel env rm NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production --yes
vercel env rm NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN preview --yes
vercel env rm NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN development --yes
vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production preview development

vercel env rm NEXT_PUBLIC_FIREBASE_PROJECT_ID production --yes
vercel env rm NEXT_PUBLIC_FIREBASE_PROJECT_ID preview --yes
vercel env rm NEXT_PUBLIC_FIREBASE_PROJECT_ID development --yes
vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production preview development

vercel env rm NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production --yes
vercel env rm NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET preview --yes
vercel env rm NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET development --yes
vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production preview development

vercel env rm NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production --yes
vercel env rm NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID preview --yes
vercel env rm NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID development --yes
vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production preview development

vercel env rm NEXT_PUBLIC_FIREBASE_APP_ID production --yes
vercel env rm NEXT_PUBLIC_FIREBASE_APP_ID preview --yes
vercel env rm NEXT_PUBLIC_FIREBASE_APP_ID development --yes
vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production preview development

vercel env rm NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID production --yes
vercel env rm NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID preview --yes
vercel env rm NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID development --yes
vercel env add NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID production preview development

# Backend Variable
vercel env rm FIREBASE_PROJECT_ID production --yes
vercel env rm FIREBASE_PROJECT_ID preview --yes
vercel env rm FIREBASE_PROJECT_ID development --yes
vercel env add FIREBASE_PROJECT_ID production preview development

Write-Host "`nEnvironment variables updated!" -ForegroundColor Green
Write-Host "Please enter the values when prompted:" -ForegroundColor Yellow
Write-Host "NEXT_PUBLIC_FIREBASE_API_KEY: AIzaSyCJL0zm1lrejfzLQpZNiWExtjo_vT_l1zQ" -ForegroundColor Cyan
Write-Host "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: yudi-8bd6f.firebaseapp.com" -ForegroundColor Cyan
Write-Host "NEXT_PUBLIC_FIREBASE_PROJECT_ID: yudi-8bd6f" -ForegroundColor Cyan
Write-Host "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: yudi-8bd6f.firebasestorage.app" -ForegroundColor Cyan
Write-Host "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: 882569998626" -ForegroundColor Cyan
Write-Host "NEXT_PUBLIC_FIREBASE_APP_ID: 1:882569998626:web:4669942f4304a1f2fb757b" -ForegroundColor Cyan
Write-Host "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: G-1WDBCQ7PG4" -ForegroundColor Cyan
Write-Host "FIREBASE_PROJECT_ID: yudi-8bd6f" -ForegroundColor Cyan
