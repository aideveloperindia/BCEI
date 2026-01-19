# 🚀 Setup Guide

## Prerequisites

- Node.js 18+ installed
- Firebase account
- Vercel account (for deployment)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Firebase Setup (Per Client)

For each of your 20 clients, you need to:

### 2.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project: `bar-council-client1` (or client2, client3, etc.)
3. Enable **Firestore Database** (Native mode)
4. Enable **Cloud Messaging** (FCM)

### 2.2 Create Web App

1. In Firebase Console, go to Project Settings → General
2. Scroll to "Your apps" → Click Web icon (`</>`)
3. Register app with a nickname
4. Copy the Firebase config (you'll need this)

### 2.3 Generate VAPID Key

1. Go to Project Settings → Cloud Messaging
2. Scroll to "Web Push certificates"
3. Click "Generate key pair" (if not already generated)
4. Copy the VAPID key

### 2.4 Create Service Account

1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Copy the entire JSON content (you'll need it for environment variables)

### 2.5 Set Firestore Security Rules

Go to Firestore → Rules and set:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /fcm_tokens/{tokenId} {
      allow read: if false; // Only server can read
      allow write: if false; // Only server can write
    }
  }
}
```

## Step 3: Configure Client Mapping

Edit `config/client-firebase-map.ts` and add all 20 clients:

```typescript
export const clientFirebaseMap: Record<string, ClientFirebaseConfig> = {
  'client1.com': {
    projectId: 'bar-council-client1',
    serviceAccountEnv: 'FIREBASE_SERVICE_ACCOUNT_CLIENT1',
    collectionName: 'fcm_tokens',
    topicName: 'notifications',
    branding: {
      title: 'Get Bar Council Election Updates',
      subtitle: 'Stay updated with important election updates',
    },
  },
  'client2.com': {
    projectId: 'bar-council-client2',
    serviceAccountEnv: 'FIREBASE_SERVICE_ACCOUNT_CLIENT2',
    // ... same structure
  },
  // ... add all 20 clients
};
```

## Step 4: Environment Variables

Create `.env.local` file (copy from `.env.local.example`):

```env
# Client 1
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=client1-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID_CLIENT1=bar-council-client1
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=client1-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key

FIREBASE_SERVICE_ACCOUNT_CLIENT1={"type":"service_account","project_id":"bar-council-client1",...}

# Repeat for all 20 clients
# NEXT_PUBLIC_FIREBASE_PROJECT_ID_CLIENT2=...
# FIREBASE_SERVICE_ACCOUNT_CLIENT2=...
# etc.

ADMIN_PASSWORD=your-secure-password
```

## Step 5: Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Step 6: Deploy to Vercel

### 6.1 Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your Git repository
4. Name it: `bar-council-notifications`

### 6.2 Add Domains

1. Go to Project Settings → Domains
2. Add all 20 client domains:
   - client1.com
   - client2.com
   - ... (all 20)

### 6.3 Add Environment Variables

1. Go to Project Settings → Environment Variables
2. Add all environment variables from Step 4
3. Make sure to add variables for all 20 clients

### 6.4 Deploy

Vercel will automatically deploy when you push to your Git repository.

## Step 7: Test

1. Visit one of your client domains (e.g., `client1.com`)
2. Click "Allow Notifications"
3. Check Firestore to see if token was saved
4. Go to `/admin` and login
5. Send a test notification from `/admin/push-notifications`

## Troubleshooting

### Logo not showing
- Make sure `advocates-logo.png` is in `/public` folder
- Check file name matches exactly

### Firebase errors
- Verify all environment variables are set correctly
- Check Firebase project ID matches in all places
- Ensure service account JSON is valid

### Notifications not received
- Check service worker is registered (check browser console)
- Verify VAPID key is correct
- Check browser notification permissions

### Admin login not working
- Verify `ADMIN_PASSWORD` environment variable is set
- Check browser console for errors

## Next Steps

1. Add all 20 clients to `client-firebase-map.ts`
2. Set up all 20 Firebase projects
3. Add all environment variables to Vercel
4. Test each client domain
5. Start sending notifications!
