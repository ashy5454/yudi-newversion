# Setup chat.yudi.co.in - Complete Guide

Follow these steps to set up your custom domain and fix Google Sign-In.

## Step 1: Add Domain in Vercel Dashboard

1. **Go to Vercel Project Settings**
   - Visit: https://vercel.com/team-yudis-projects/yudi-chat-master/settings/domains
   - Or: Click your project → Settings → Domains

2. **Add the Domain**
   - In the "Domain" input field, type: `chat.yudi.co.in`
   - Click "Add"

3. **Get DNS Configuration**
   - Vercel will show you the DNS records needed
   - You'll see something like:
   ```
   Type: CNAME
   Name: chat
   Value: cname.vercel-dns.com
   ```

## Step 2: Add DNS Record

1. **Go to Your Domain Provider**
   - Log in to where you manage `yudi.co.in` DNS
   - (GoDaddy, Namecheap, Cloudflare, or wherever your domain is registered)

2. **Add CNAME Record**
   ```
   Type: CNAME
   Name: chat
   Target: cname.vercel-dns.com
   TTL: Automatic (or 3600)
   ```

3. **Save the Record**
   - Click Save/Add Record
   - Wait for DNS propagation (usually 5-30 minutes)

## Step 3: Wait for Vercel Verification

1. **Check Vercel Dashboard**
   - Go back to: https://vercel.com/team-yudis-projects/yudi-chat-master/settings/domains
   - Vercel will automatically verify the domain
   - Once verified, it will show a ✓ checkmark
   - SSL certificate will be automatically issued

2. **Check DNS Propagation**
   - Visit: https://dnschecker.org
   - Enter: `chat.yudi.co.in`
   - Wait until it shows the CNAME record globally

## Step 4: Add Domain to Firebase

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/project/yudi-8bd6f/authentication/settings

2. **Add Authorized Domain**
   - Scroll to "Authorized domains" section
   - Click "Add domain"
   - Enter: `chat.yudi.co.in`
   - Click "Add"

3. **Verify Your Domains**
   You should now have:
   - ✓ localhost
   - ✓ yudi-8bd6f.firebaseapp.com
   - ✓ app.yudi.co.in
   - ✓ chat.yudi.co.in ← NEW

## Step 5: Test Your Setup

1. **Wait 2-5 minutes** after adding to Firebase
2. **Visit**: https://chat.yudi.co.in
3. **Try Google Sign-In** - It should work!

## Current Deployment URLs

Your app is accessible at:
- ✓ Production (Vercel): https://yudi-chat-master-c9xqizhn8-team-yudis-projects.vercel.app
- ⏳ Custom Domain: https://chat.yudi.co.in (after DNS setup)

## DNS Record Quick Reference

If your domain provider asks for these details:

| Field | Value |
|-------|-------|
| Type | CNAME |
| Name | chat |
| Value | cname.vercel-dns.com |
| TTL | 3600 (or Auto) |
| Proxy | Off (if using Cloudflare) |

## Troubleshooting

**Domain not verifying in Vercel?**
- Wait at least 1 hour for DNS propagation
- Check DNS with: https://dnschecker.org
- Ensure CNAME points to: `cname.vercel-dns.com`
- If using Cloudflare, disable proxy (orange cloud → grey cloud)

**Google Sign-In not working?**
- Verify `chat.yudi.co.in` is in Firebase authorized domains
- Clear browser cache
- Try incognito/private mode
- Wait 2-3 minutes after adding to Firebase

**SSL Certificate Issues?**
- Vercel automatically issues SSL
- Wait 5-10 minutes after domain verification
- Try accessing with `https://` (not `http://`)

## Next Steps After Setup

Once everything is working:
1. Update any links/bookmarks to use `chat.yudi.co.in`
2. Consider keeping the Vercel URL as a backup
3. Update documentation with the new URL
4. Test all features including Google Sign-In

## Need Help?

If you encounter issues:
1. Check the Vercel dashboard for domain status
2. Verify DNS records are correct
3. Check Firebase authorized domains list
4. Look at browser console for specific errors
