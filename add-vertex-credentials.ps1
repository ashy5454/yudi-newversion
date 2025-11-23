# Add Vertex AI credentials to Vercel
$credentials = Get-Content "credentials\vertex-ai-service-account.json" -Raw

# Add to production environment
Write-Host "Adding GOOGLE_APPLICATION_CREDENTIALS_JSON to Vercel..."
$credentials | vercel env add GOOGLE_APPLICATION_CREDENTIALS_JSON production

Write-Host "`nDone! The credentials have been added to Vercel."
Write-Host "The changes will take effect on the next deployment."
Write-Host "`nTo redeploy immediately, run: vercel --prod"
