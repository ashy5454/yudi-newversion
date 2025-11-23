# Custom Domain Setup Guide

Setting up a custom domain for your Vercel deployment and Firebase authentication.

## Prerequisites
- A domain name (you already have `yudi.co.in`)
- Access to your domain's DNS settings
- Vercel account access

## Step 1: Add Custom Domain to Vercel

### Option A: Using Vercel Dashboard (Recommended)

1. **Go to Vercel Project Settings**
   - Visit: https://vercel.com/team-yudis-projects/yudi-chat-master/settings/domains

2. **Add Your Domain**
   - Enter your desired subdomain, for example:
     - `chat.yudi.co.in`
     - OR `app.yudi.co.in` (if not already used)
   - Click "Add"

3. **Configure DNS**
   Vercel will show you DNS records to add. You'll need to add:
   
   **For subdomain (e.g., chat.yudi.co.in):**
   ```
   Type: CNAME
   Name: chat (or your subdomain)
   Value: cname.vercel-dns.com
   ```

4. **Add DNS Record**
   - Go to your domain registrar (where you manage yudi.co.in)
   - Add the CNAME record as shown by Vercel
   - Save the changes

5. **Wait for Verification**
   - DNS propagation can take 24-48 hours (usually faster, 5-30 minutes)
   - Vercel will automatically verify and issue an SSL certificate

### Option B: Using Vercel CLI

```bash
cd yudi-chat-master
vercel domains add chat.yudi.co.in
```

Then follow the DNS instructions provided.

## Step 2: Add Custom Domain to Firebase Authorized Domains

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/project/yudi-8bd6f/authentication/settings

2. **Add Authorized Domain**
   - Click "Add domain" in the "Authorized domains" section
   - Enter your custom domain: `chat.yudi.co.in`
   - Click "Add"

3. **Verify Domains List**
   After adding, you should have:
   - localhost
   - yudi-8bd6f.firebaseapp.com
   - app.yudi.co.in (existing)
   - chat.yudi.co.in (newly added)

## Step 3: Test Your Setup

1. Wait for DNS propagation (check with: https://dnschecker.org)
2. Visit your custom domain: `https://chat.yudi.co.in`
3. Try Google Sign-In - it should work!

## Recommended Domain Structure

Since you already have `app.yudi.co.in`, consider:
- `chat.yudi.co.in` - For the chat application
- `admin.yudi.co.in` - For admin access
- `api.yudi.co.in` - For API endpoints (if needed)

## Benefits of Custom Domain

✅ Professional appearance
✅ Permanent URL (won't change with deployments)
✅ No need to update Firebase authorized domains after each deploy
✅ Better for production use
✅ Easier to share with users

## Troubleshooting

**Domain not verifying?**
- Check DNS propagation: https://dnschecker.org
- Ensure CNAME record is correct
- Wait at least 1 hour

**Google Sign-In still not working?**
- Verify domain is in Firebase authorized domains
- Clear browser cache
- Wait 2-3 minutes after adding domain to Firebase
- Check browser console for specific errors

## Current Status

Your app is currently deployed at:
- Vercel URL: https://yudi-chat-master-c9xqizhn8-team-yudis-projects.vercel.app
- After setup, will also be available at: https://chat.yudi.co.in (or your chosen subdomain)
