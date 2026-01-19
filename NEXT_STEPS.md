# 🚀 Next Steps - Action Plan

## ✅ What's Done
- ✅ Project structure created
- ✅ Landing page with logo
- ✅ Firebase integration code
- ✅ Admin panel
- ✅ API routes
- ✅ Service worker
- ✅ Multi-client support

## 📋 What You Need to Do Next

### Step 1: Install Dependencies (5 minutes)

```bash
npm install
```

This will install all required packages (Next.js, Firebase, etc.)

---

### Step 2: Test the Landing Page Locally (5 minutes)

```bash
npm run dev
```

Visit: http://localhost:3000

**What to check:**
- ✅ Logo displays correctly
- ✅ Page looks good (black background, logo, text, button)
- ✅ Button is clickable (won't work fully without Firebase, but should show)

---

### Step 3: Set Up Firebase Projects (2-3 hours for 20 clients)

**For EACH of your 20 clients, you need to:**

#### 3.1 Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name: `bar-council-client1` (or client2, client3, etc.)
4. Enable Google Analytics: **No** (optional)
5. Click "Create project"

#### 3.2 Enable Firestore
1. In Firebase Console → Build → Firestore Database
2. Click "Create database"
3. Select "Start in production mode"
4. Choose location (closest to your users)
5. Click "Enable"

#### 3.3 Enable Cloud Messaging
1. In Firebase Console → Build → Cloud Messaging
2. It's already enabled by default

#### 3.4 Create Web App
1. In Firebase Console → Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click Web icon (`</>`)
4. Register app: `bar-council-web`
5. **Copy these values** (you'll need them):
   - apiKey
   - authDomain
   - projectId
   - storageBucket
   - messagingSenderId
   - appId

#### 3.5 Generate VAPID Key
1. In Firebase Console → Project Settings → Cloud Messaging
2. Scroll to "Web Push certificates"
3. Click "Generate key pair" (if not already generated)
4. **Copy the VAPID key**

#### 3.6 Create Service Account
1. In Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Click "Generate key" (downloads JSON file)
4. **Open the JSON file and copy the entire content** (you'll need it)

#### 3.7 Set Firestore Security Rules
1. In Firebase Console → Firestore Database → Rules
2. Replace with:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /fcm_tokens/{tokenId} {
      allow read: if false;
      allow write: if false;
    }
  }
}
```
3. Click "Publish"

**Repeat steps 3.1-3.7 for all 20 clients!**

---

### Step 4: Configure Client Mapping (30 minutes)

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
    collectionName: 'fcm_tokens',
    topicName: 'notifications',
    branding: {
      title: 'Get Bar Council Election Updates',
      subtitle: 'Stay updated with important election updates',
    },
  },
  // ... add all 20 clients
};
```

**Replace `'client1.com'`, `'client2.com'` with your actual client domains!**

---

### Step 5: Create Environment Variables File (30 minutes)

1. Create `.env.local` file in the project root:

```bash
touch .env.local
```

2. Add environment variables for each client:

```env
# Client 1
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-from-client1
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=bar-council-client1.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID_CLIENT1=bar-council-client1
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=bar-council-client1.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id-from-client1
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id-from-client1
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key-from-client1

FIREBASE_SERVICE_ACCOUNT_CLIENT1={"type":"service_account","project_id":"bar-council-client1","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"..."}

# Client 2
NEXT_PUBLIC_FIREBASE_PROJECT_ID_CLIENT2=bar-council-client2
FIREBASE_SERVICE_ACCOUNT_CLIENT2={"type":"service_account",...}

# ... repeat for all 20 clients

# Admin Password
ADMIN_PASSWORD=your-secure-password-here
```

**Important:** 
- Replace all `your-*` values with actual values from Firebase
- For `FIREBASE_SERVICE_ACCOUNT_CLIENT1`, paste the entire JSON from the service account file
- Keep the JSON on a single line (no line breaks)

---

### Step 6: Test Locally with Firebase (30 minutes)

1. Restart dev server:
```bash
npm run dev
```

2. Visit http://localhost:3000

3. Click "Allow Notifications"
   - Should request browser permission
   - Should save token to Firestore
   - Should show success message

4. Check Firestore:
   - Go to Firebase Console → Firestore Database
   - Should see `fcm_tokens` collection
   - Should see your token saved

5. Test Admin Panel:
   - Visit http://localhost:3000/admin
   - Login with your admin password
   - Go to http://localhost:3000/admin/push-notifications
   - Send a test notification

---

### Step 7: Set Up Git Repository (15 minutes)

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Bar Council push notification system"

# Create repository on GitHub/GitLab
# Then connect:
git remote add origin https://github.com/yourusername/bar-council-notifications.git
git branch -M main
git push -u origin main
```

---

### Step 8: Deploy to Vercel (30 minutes)

#### 8.1 Create Vercel Project
1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Import your Git repository
4. Project name: `bar-council-notifications`
5. Framework: Next.js (auto-detected)
6. Click "Deploy" (don't add env vars yet)

#### 8.2 Add All Domains
1. Go to Project Settings → Domains
2. Add all 20 client domains:
   - client1.com
   - client2.com
   - ... (all 20)

#### 8.3 Add Environment Variables
1. Go to Project Settings → Environment Variables
2. Add ALL variables from your `.env.local` file
3. Make sure to add for all 20 clients
4. Click "Save" after each addition

#### 8.4 Redeploy
1. Go to Deployments tab
2. Click "..." on latest deployment
3. Click "Redeploy"
4. Wait for deployment to complete

---

### Step 9: Configure DNS (15 minutes per client)

For each client domain:

1. Go to your domain registrar (where you bought the domain)
2. Add DNS records:
   - Type: `CNAME`
   - Name: `@` (or `www`)
   - Value: `cname.vercel-dns.com` (Vercel will show you the exact value)
3. Wait for DNS propagation (5-30 minutes)

---

### Step 10: Test Production (30 minutes)

1. Visit each client domain (e.g., `client1.com`)
2. Test notification subscription
3. Check Firestore to verify tokens are saved
4. Test admin panel
5. Send test notification from admin panel
6. Verify notification is received

---

## 🎯 Priority Order

**If you're short on time, do this first:**

1. ✅ Install dependencies (`npm install`)
2. ✅ Test landing page locally (`npm run dev`)
3. ✅ Set up **ONE** Firebase project (to test)
4. ✅ Configure **ONE** client in `client-firebase-map.ts`
5. ✅ Add **ONE** client's environment variables
6. ✅ Test locally with that one client
7. ✅ Deploy to Vercel with one client
8. ✅ Test production
9. ✅ Then add remaining 19 clients

**Once one client works, adding the rest is just copy-paste!**

---

## 📝 Quick Checklist

- [ ] Install dependencies
- [ ] Test landing page locally
- [ ] Create 20 Firebase projects
- [ ] Configure client mapping
- [ ] Add environment variables
- [ ] Test locally with Firebase
- [ ] Push to Git
- [ ] Deploy to Vercel
- [ ] Add all domains to Vercel
- [ ] Add all environment variables to Vercel
- [ ] Configure DNS for all domains
- [ ] Test production

---

## 🆘 Need Help?

- See `SETUP.md` for detailed Firebase setup
- See `README.md` for project overview
- Check browser console for errors
- Check Vercel logs for deployment issues

---

## ⏱️ Estimated Time

- **Quick test (one client):** 2-3 hours
- **Full setup (all 20 clients):** 1-2 days

**Start with one client, then scale!** 🚀
