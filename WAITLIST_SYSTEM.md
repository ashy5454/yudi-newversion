# 🎯 Waitlist & Trial System Documentation

## Overview

This system implements a freemium model with a 4-minute trial period and waitlist functionality. Users start with trial access and can be upgraded to full access by admins.

## How It Works

### 1. **User Access Levels**

- **`trial`**: Default for all new users
  - 4-minute time limit (text chat + voice calls combined)
  - Can only create or use ONE persona
  - Timer shown in top-right corner
  - Lockout screen when time expires

- **`approved`**: Full access (set by admin)
  - No time limits
  - Can create/use unlimited personas
  - No timer displayed
  - Full access to all features

### 2. **Device Fingerprinting**

- Uses FingerprintJS to track devices
- Prevents users from creating multiple accounts on the same device
- Device trial is tracked in `device_trials` collection
- Even if user logs out and creates new account, device is still blocked after 4 minutes

### 3. **Timer System**

- **Database-based**: Uses `trialStartedAt` timestamp in user document
- **Device-based**: Also tracks device first use in `device_trials`
- Timer calculates remaining time from server timestamp (prevents browser refresh reset)
- Shows countdown in top-right corner (red when < 1 minute remaining)

### 4. **Persona Restrictions**

- Trial users can only:
  - Create ONE persona, OR
  - Use ONE existing persona
- Once they've created or used a persona, they cannot:
  - Create another persona
  - Chat/call with a different persona
- Full access users have no restrictions

## Components

### Hooks

1. **`useDeviceProtection`** (`src/hooks/useDeviceProtection.ts`)
   - Generates device fingerprint
   - Checks if device has already used trial
   - Bypasses check for approved users

2. **`useAccessControl`** (`src/hooks/useAccessControl.ts`)
   - Main access control hook
   - Checks user access level
   - Calculates remaining trial time
   - Tracks persona usage
   - Returns access state

### Components

1. **`TrialTimer`** (`src/components/TrialTimer.tsx`)
   - Displays countdown timer
   - Shows in top-right corner
   - Red/pulsing when < 1 minute remaining

2. **`TrialLockout`** (`src/components/TrialLockout.tsx`)
   - Full-screen overlay when trial expires
   - Shows "HEYYY SORRY! JOIN THE WAITLIST FOR MORE ACCESS!"
   - Button links to Tally form

3. **`AccessControlWrapper`** (`src/components/AccessControlWrapper.tsx`)
   - Wraps main app layout
   - Shows timer if trial user
   - Shows lockout if blocked
   - Hides everything for approved users

## How to Give Users Full Access

### Method 1: Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database**
4. Go to `users` collection
5. Find the user's document (by email or UID)
6. Edit the document
7. Change `accessLevel` field from `"trial"` to `"approved"`
8. Save

**That's it!** The next time the user logs in, they'll have full access.

### Method 2: Admin Dashboard (If Available)

If you have an admin dashboard, you can add a UI to:
- List all users
- Filter by access level
- Toggle access level with a button

## Database Structure

### User Document (`users/{userId}`)

```typescript
{
  id: string;
  email: string;
  displayName: string;
  accessLevel: 'trial' | 'approved';  // 👈 KEY FIELD
  trialStartedAt: Timestamp;           // When trial started
  // ... other fields
}
```

### Device Trial Document (`device_trials/{visitorId}`)

```typescript
{
  visitorId: string;                   // Device fingerprint
  firstUsedAt: Timestamp;              // When device first used Yudi
  associatedEmails: string[];          // Emails that used this device
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Waitlist Form

- **URL**: https://tally.so/r/nrQAB2
- **Button**: "Join the Waitlist!" on landing page
- **Also shown**: In lockout screen when trial expires

## User Flow

### New User (Trial)

1. User clicks "Try Yudi" on landing page
2. Signs in with Google
3. User document created with `accessLevel: 'trial'`
4. `trialStartedAt` set to current time
5. Device fingerprint saved to `device_trials`
6. Timer starts counting down from 4:00
7. User can create OR use one persona
8. After 4 minutes → Lockout screen appears
9. User clicks "Join Waitlist" → Redirected to Tally form

### Approved User

1. Admin changes `accessLevel` to `"approved"` in Firestore
2. User logs in
3. `AccessControlWrapper` sees `accessLevel === 'approved'`
4. Timer hidden, all restrictions removed
5. Full access to all features

## Testing

### Test Trial Flow

1. Create a new account (or use incognito)
2. Sign in
3. Verify timer appears in top-right
4. Create a persona or start a chat
5. Wait 4 minutes (or manually set `trialStartedAt` to 4+ minutes ago in Firestore)
6. Verify lockout screen appears
7. Click "Join Waitlist" → Should open Tally form

### Test Device Protection

1. Use trial on Device A
2. Wait for trial to expire
3. Log out
4. Create new account on same Device A
5. Sign in
6. Should immediately see lockout screen (device already used)

### Test Approved Access

1. Set user's `accessLevel` to `"approved"` in Firestore
2. User logs in
3. Verify:
   - No timer shown
   - Can create multiple personas
   - Can chat/call without time limit
   - No restrictions

## Troubleshooting

### Timer Not Showing

- Check if `accessLevel` is set to `"trial"` in user document
- Check if `trialStartedAt` is set
- Check browser console for errors

### User Still Blocked After Approval

- Verify `accessLevel` is exactly `"approved"` (not `"trial"`)
- Check if device is also blocked (device check bypasses for approved users)
- Clear browser cache and reload

### Timer Resets on Refresh

- This shouldn't happen (uses database timestamp)
- Check if `trialStartedAt` is being overwritten
- Verify `useAccessControl` hook is using database time, not local time

## Security Notes

- Device fingerprinting is ~98% effective
- Advanced users can bypass by changing IP + browser
- For MVP, this is sufficient
- Approved users bypass all device checks

## Future Enhancements

- Admin dashboard UI for managing access
- Email notifications when users join waitlist
- Analytics on trial → waitlist conversion
- A/B testing different trial durations
- Referral system for waitlist

