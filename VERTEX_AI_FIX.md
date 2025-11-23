# Fix Vertex AI Credentials for Vercel Deployment

## Problem
The app was looking for `credentials/vertex-ai-service-account.json` which doesn't exist on Vercel (gitignored folder).

## Solution Summary

✅ **Code changes completed** - Created helper module to handle credentials from environment variables  
⏳ **Action required** - You need to add the credentials as an environment variable in Vercel  
⏳ **Redeploy needed** - Deploy after adding the environment variable  

---

## What I Fixed (Code Changes - Already Done ✅)

### 1. Created Vertex AI Helper Module
- **File:** `src/lib/vertexai.ts`
- Handles credentials from environment variable
- Creates temporary file for GoogleGenAI SDK
- Falls back to local credentials in development

### 2. Updated API Routes
- **File:** `src/app/api/chat/route.ts` - Uses helper for chat functionality
- **File:** `src/app/api/persona/enhance/route.ts` - Uses helper for persona enhancement

---

## What You Need to Do

### Step 1: Add Environment Variable to Vercel ⚠️ REQUIRED

1. Go to: https://vercel.com/team-yudis-projects/yudi-chat-master/settings/environment-variables

2. Click **"Add New"**

3. Enter:
   - **Name:** `GOOGLE_APPLICATION_CREDENTIALS_JSON`
   - **Value:** Copy and paste this ENTIRE JSON (one line):
     ```json
     {"type":"service_account","project_id":"yudi-8bd6f","private_key_id":"1a041a4de9e6997898e109173053cc90734d4daf","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCTInZMuSSdNRHZ\nMpIIixxntcYrzLV7OGRo9Xv2qy6hQ6oEGXbeMfHyAm3EudDrNfDTToE4NCHWEa8e\n0YTIOpxSGsrGRjk+Jzw60wuHMpJ3WbYbG5kcYNx+SHEW+WlHoJvkR2ttjU9oZjXA\nNz75bIeRI99MLG0rcUkNKHJU3tobJmcTgfOjmmSE2Rjx8FP30nAsozOMNyt8voVa\nImZpDUNTSkybAMb3ODhBKgXrYbVdi4ELwv0tXnH0EQMZoe+wz3JPwPLWPLr5PQBy\njn4dxyy7CSoZow17LWWdjGwtYKZNAamyO8PT8GO04EVUZE2hRZ1IKHJlj1YI13nY\nvvwHxFh/AgMBAAECggEARaV0dhDVggzS7AsCEUU4JudmbOkzpqYk8YHyMesJ4ZAT\n9GjRWZAuxK3do9eJSy13V667gA09TwWD7YSj49vKjxrbjUtEYWVVH0szE8YeipxO\nlTpVGZfIB4bm8UcSTLN712zvLyZKxlJLczczegGjklJ2qqoE6yFuwOm6ZO4wM9Ub\n/lvPrIHWImFDJd5u9b/3BwhqD7hCC2Vu/mXaBD2GJLL82/lW13BYHevhsDm7C6mv\nf1L6Xxts1ftN7qdCv7xLGzdiWJMIVduwrCs0s9jNCUH/sPOvpBOFyB8h1V551A7z\nePlrqaX9eZkvhA9Ig8FUhGOYh26En/uB6uTqdkIs0QKBgQDG9oinMKqBld0dyJHE\nXjIKDDb8XwCMqFOwB6mfWby/BiwjuxyZxHIPGBnYo5FLvBs1RhrBrfhQx0t/gpXY\nt7KJ7rDHMi8GFG/kwGQXqR+7LqGUOJY2aXdFGigH83WE61w0kt5tHiJVs2bElfom\nXQ0F/tP8KzcglfxZtWrUPLyDvQKBgQC9UFqK2XuoNYM9Gpn0GA8rj40y5p8P9DFP\n6xj/wHGWpv3UxtHIrhXUzdwb0WZUCAYpu04SQJ4pnREBhOHtBvOXGVS3iFkGd71k\nQCM66IkiV+EInCY8SvBr+XDR2C1A8zE8vnnvhAfLXURIkaoi4l4eqHGmi1spoJro\nXcOVAnay6wKBgDiUcUYCS+qwAIJwwCs0kkxTLuvT5Gcbkzjy5OTA8zDrg2/hzP9Z\nYwox01/NHAuKgb5DomZDn+Lw2eJ38z7+9lHNRA5RkhfLhgpqP8yOtsxXNXHeKbFt\nipJnHs0sCdZzy/PTdFdZg3AVpXrwH4P7YDG9RvFmJLYqkOm98pRKdV2NAoGAEVW3\nRLmPYiKsRr8V080ULofxhPSrIfnZPhkn69tCS2o1GfOup/KQ2zCSdBWjihRGBDI7\nft5d3S+drAbv7RVS3sYaBMg+ZqI2PGTHFRDP5c4oM/KgaarvAuQPWZey5RyfqJFE\ndxMe55c9tmtoKdOSjLod1gMysMgdByP20cEs/0sCgYBhiR5kaewD+fxWjOeXDLRs\n69+V1rNycBV8OMVG6g4RosvCKosxVEWhM61vlKTS5q1iuv1dUc7ORgt5MbE2UQFr\njX2bcdy2NhgYVeWhVBVLVcfNLFBfDsyPts65OkBfNytMhZ3clWxDDQJQ4hBXxHh3\ngQBE0UMCLRSPIv83GOLHXA==\n-----END PRIVATE KEY-----\n","client_email":"vertex-ai-yudi@yudi-8bd6f.iam.gserviceaccount.com","client_id":"101487163791275092492","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/vertex-ai-yudi%40yudi-8bd6f.iam.gserviceaccount.com","universe_domain":"googleapis.com"}
     ```
   - **Environments:** Select **all 3**: Production, Preview, Development

4. Click **Save**

### Step 2: Redeploy

After adding the environment variable, redeploy:
```powershell
cd yudi-chat-master
vercel --prod
```

### Step 3: Test

Test the chat feature at https://chat.yudi.co.in - it should work! ✅

---

## Summary

- ✅ **Google Sign-In** - Working!
- ✅ **Code Updated** - All API routes now use environment variable for credentials
- ⏳ **Pending** - Add `GOOGLE_APPLICATION_CREDENTIALS_JSON` to Vercel
- ⏳ **Pending** - Redeploy to production
