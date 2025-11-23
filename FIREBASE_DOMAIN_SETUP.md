# Firebase Authorized Domains Setup

Your Vercel deployment is complete! Now you need to add your Vercel domain to Firebase's authorized domains list to enable Google Sign-In.

## Your Vercel Production URL
```
yudi-chat-master-c9xqizhn8-team-yudis-projects.vercel.app
```

## Steps to Add Authorized Domain

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/project/yudi-8bd6f/authentication/settings

2. **Navigate to Authorized Domains**
   - Click on the "Settings" tab
   - Scroll down to "Authorized domains" section

3. **Add Your Vercel Domain**
   - Click "Add domain" button
   - Enter: `yudi-chat-master-c9xqizhn8-team-yudis-projects.vercel.app`
   - Click "Add"

4. **Verify Current Domains**
   You should see these domains in the list:
   - localhost (for local development)
   - yudi-8bd6f.firebaseapp.com (default)
   - app.yudi.co.in (your custom domain)
   - yudi-chat-master-c9xqizhn8-team-yudis-projects.vercel.app (newly added)

## After Adding

Once you've added the domain:
1. Wait 1-2 minutes for the changes to propagate
2. Visit: https://yudi-chat-master-c9xqizhn8-team-yudis-projects.vercel.app
3. Try signing in with Google - it should work!

## Note on Vercel URLs

Vercel generates a unique URL for each deployment. If you want a permanent URL:
- Set up a custom domain in Vercel (e.g., chat.yudi.co.in)
- Add that custom domain to Firebase authorized domains instead
- This way you won't need to update the domain after each deployment
