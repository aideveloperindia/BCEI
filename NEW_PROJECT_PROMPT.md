# 🚀 NEW PROJECT: Push Notification Subscription Landing Page

## 📋 Project Overview

Create a **standalone Next.js web application** that serves as a minimal landing page for Bar Council Elections. Users will receive an SMS with a link to this page. When they visit, they can subscribe to push notifications by clicking "Allow". Once subscribed, an admin can send push notifications to all subscribers.

**Key Requirements:**
- ✅ Simple, clean landing page with "Bar Council Elections Information" branding
- ✅ One-click push notification subscription (Allow/Deny button)
- ✅ Store FCM tokens in Firebase Firestore (100% reliable, free tier)
- ✅ Admin panel to send push notifications to all subscribers
- ✅ Password-protected admin routes
- ✅ Multi-client support (different domains for different clients)
- ✅ Mobile-responsive design
- ✅ Deploy to Vercel
- ✅ Zero server/database costs (Firebase free tier)

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Push Notifications:** Firebase Cloud Messaging (FCM)
- **Backend:** Firebase Admin SDK (for sending notifications)
- **Storage:** Firebase Firestore (for storing FCM tokens - free tier, reliable)
- **Deployment:** Vercel
- **Package Manager:** npm

---

## 📦 Required Dependencies

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "firebase": "^12.7.0",
    "firebase-admin": "^13.6.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0"
  }
}
```

---

## 🏗️ Project Structure

```
project-root/
├── app/
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                    # Main landing page (subscription page)
│   ├── globals.css                 # Global styles
│   ├── admin/
│   │   ├── page.tsx                # Admin login page (password protected)
│   │   └── push-notifications/
│   │       └── page.tsx            # Admin panel to send notifications
│   └── api/
│       ├── save-fcm-token/
│       │   └── route.ts            # Save FCM token to Firestore
│       ├── send-push-notification/
│       │   └── route.ts            # Send notifications to all subscribers
│       ├── get-subscriber-count/
│       │   └── route.ts            # Get count of subscribers from Firestore
│       └── firebase-config/
│           └── route.ts            # Serve Firebase config to service worker
├── components/
│   ├── AdminProtection.tsx         # Password protection wrapper
│   └── ServiceWorkerRegistration.tsx  # Register service worker
├── lib/
│   ├── notificationManager.ts      # Client-side FCM subscription logic
│   └── content.ts                  # Content/branding configuration
├── public/
│   └── firebase-messaging-sw.js    # Service worker for background notifications
├── config/
│   └── client.config.ts            # Client-specific configuration
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── .env.local.example              # Example environment variables
```

---

## 🎨 Features to Implement

### 1. Landing Page (`app/page.tsx`)
- **Hero Section:**
  - Title: "Bar Council Elections Information"
  - Subtitle: "Stay updated with important election updates"
  - Large, prominent "Allow Notifications" button
  - Mobile-responsive design
  - Clean, professional UI

- **Functionality:**
  - On page load, check if notifications are already enabled
  - Show "Allow Notifications" button if not subscribed
  - Show "✓ You're subscribed!" message if already subscribed
  - When user clicks "Allow":
    1. Request browser notification permission
    2. Get FCM token from Firebase
    3. Save token to Firestore (with duplicate prevention)
    4. Show success message
    5. Update UI to show subscribed state

### 2. Admin Panel (`app/admin/push-notifications/page.tsx`)
- **Password Protection:** Use `AdminProtection` component
- **Features:**
  - Display subscriber count (from Firestore - real-time)
  - Input fields:
    - Notification Title (default: "Important Bar Council News")
    - Notification Message (default: "Stay updated with latest information")
  - "Send to All Subscribers" button
  - Show success/failure results
  - Display failed tokens with error reasons
  - Real-time subscriber count updates

### 3. API Routes

#### `/api/save-fcm-token` (POST)
- Receives: `{ token: string, clientId?: string }` from client
- Saves to Firestore collection: `fcm_tokens_{clientId}` (or `fcm_tokens` if no clientId)
- Document structure: `{ token: string, clientId: string, createdAt: Timestamp, updatedAt: Timestamp }`
- Uses token as document ID to prevent duplicates automatically
- **Subscribes token to FCM topic:** `client{id}_notifications` (for efficient sending)
- Returns success/error response

#### `/api/send-push-notification` (POST)
- Receives: `{ title, body, clientId?, sendToAll: true }`
- **Option A (Recommended - FCM Topics):** Sends to FCM topic `client{id}_notifications`
  - One API call per client (no Firestore reads needed!)
  - FCM handles delivery to all topic subscribers
  - Returns: `{ success: true, messageId }`
- **Option B (Fallback - Individual Tokens):** Fetches all FCM tokens from Firestore
  - Uses batch sending for efficiency (up to 500 tokens per batch)
  - Automatically removes invalid/expired tokens from Firestore
  - Returns: `{ successCount, failureCount, failedTokens }`
- Handles errors gracefully (invalid tokens, expired tokens, etc.)

#### `/api/get-subscriber-count` (GET)
- Queries Firestore collection `fcm_tokens` and counts documents
- Uses efficient count query (Firestore v9+)
- Returns: `{ count: number }`
- Fast and reliable (no formula dependencies)

#### `/api/firebase-config` (GET)
- Returns Firebase config for service worker
- Only returns public config (apiKey, projectId, etc.)

### 4. Service Worker (`public/firebase-messaging-sw.js`)
- Fetches Firebase config from `/api/firebase-config`
- Initializes Firebase Messaging
- Handles background push notifications
- Shows notification when received
- Opens home page when notification is clicked
- Silent service worker updates (no "app updated" notifications)

### 5. Client Configuration (`config/client.config.ts`)

**Domain-to-Project Mapping:**
```typescript
// config/client-firebase-map.ts
export const clientFirebaseMap: Record<string, {
  projectId: string;
  serviceAccountEnv: string; // Environment variable name
  collectionName: string;
  topicName: string;
  branding: {
    title: string;
    subtitle: string;
  };
}> = {
  'client1.com': {
    projectId: 'bar-council-client1',
    serviceAccountEnv: 'FIREBASE_SERVICE_ACCOUNT_CLIENT1',
    collectionName: 'fcm_tokens',
    topicName: 'notifications',
    branding: {
      title: "Bar Council Elections Information",
      subtitle: "Stay updated with important election updates",
    },
  },
  'client2.com': {
    projectId: 'bar-council-client2',
    serviceAccountEnv: 'FIREBASE_SERVICE_ACCOUNT_CLIENT2',
    collectionName: 'fcm_tokens',
    topicName: 'notifications',
    branding: {
      title: "Bar Council Elections Information",
      subtitle: "Stay updated with important election updates",
    },
  },
  // ... 20 clients
};

// Get config for current domain
export function getClientConfig(domain: string) {
  return clientFirebaseMap[domain] || clientFirebaseMap['client1.com'];
}
```

**Client Config:**
```typescript
// config/client.config.ts
export const clientConfig = {
  // Admin Configuration (shared across all clients)
  adminPassword: process.env.ADMIN_PASSWORD || "admin123",
};
```

---

## 🔐 Environment Variables (Vercel)

### Client-Side (NEXT_PUBLIC_*) - Per Client

**For 20 clients, you'll need 20 sets of these (or use domain-based config):**

```
# Client 1
NEXT_PUBLIC_FIREBASE_API_KEY_CLIENT1=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_CLIENT1=client1-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID_CLIENT1=bar-council-client1
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET_CLIENT1=client1-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID_CLIENT1=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID_CLIENT1=your-app-id
NEXT_PUBLIC_FIREBASE_VAPID_KEY_CLIENT1=your-vapid-key

# Client 2
NEXT_PUBLIC_FIREBASE_API_KEY_CLIENT2=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID_CLIENT2=bar-council-client2
# ... (repeat for 20 clients)
```

**OR use domain-based dynamic config (recommended):**
- Store configs in `config/client-firebase-map.ts`
- Load based on `window.location.hostname`

### Server-Side - Per Client

```
# Client 1
FIREBASE_SERVICE_ACCOUNT_CLIENT1={"type":"service_account","project_id":"bar-council-client1","private_key":"...","client_email":"..."}

# Client 2
FIREBASE_SERVICE_ACCOUNT_CLIENT2={"type":"service_account","project_id":"bar-council-client2","private_key":"...","client_email":"..."}

# ... (repeat for 20 clients)

ADMIN_PASSWORD=your-secure-password
```

**Note:** Each Firebase project uses its own service account. Firestore uses the same Firebase Service Account as FCM - no additional setup needed!

---

## 📝 Implementation Details

### 1. Firebase Setup
- Create Firebase project
- **Upgrade to Blaze Plan (Pay-as-you-go)** - Required for production use
  - Still has free tier, only pay for what you use beyond free tier
  - Required for external API calls from Vercel
- Enable Cloud Messaging (FCM)
- Enable Firestore Database (Native mode)
- Create Web App in Firebase Console
- Generate VAPID key (Project Settings → Cloud Messaging → Web Push certificates)
- Create Service Account (Project Settings → Service Accounts → Generate new private key)
- Set Firestore Security Rules (for production):
  ```javascript
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      // Only allow server-side writes (via Admin SDK)
      match /fcm_tokens/{tokenId} {
        allow read: if false; // Only server can read
        allow write: if false; // Only server can write
      }
      match /fcm_tokens_{clientId}/{tokenId} {
        allow read: if false; // Only server can read
        allow write: if false; // Only server can write
      }
    }
  }
  ```
- **Firestore Free Tier:** 1GB storage, 50K reads/day, 20K writes/day
- **FCM Topics:** Unlimited subscribers per topic, free to use

### 3. Notification Manager (`lib/notificationManager.ts`)
- Request browser permission
- Get FCM token using `getToken()` from Firebase Messaging
- Save token to `/api/save-fcm-token` (which also subscribes to FCM topic)
- Subscribe token to FCM topic: `client{id}_notifications` (server-side)
- Handle foreground messages with `onMessage()`
- Show in-app notifications when app is open

### 4. Admin Protection (`components/AdminProtection.tsx`)
- Simple password check (client-side for now)
- Store password in environment variable
- Redirect to `/admin` if not authenticated
- Protect all `/admin/*` routes

### 5. Error Handling
- Handle invalid/expired FCM tokens gracefully
- Log errors to console (and Vercel logs)
- Show user-friendly error messages
- Retry logic for failed API calls

---

## 🎯 Key Code Patterns

### Requesting Notification Permission
```typescript
const permission = await Notification.requestPermission();
if (permission === "granted") {
  // Get FCM token and save to server
}
```

### Sending Notifications (Server-Side)

#### Option A: FCM Topics (Recommended - Cost Effective)
```typescript
// Send to all subscribers of a topic (NO Firestore reads needed!)
const message = {
  topic: `client${clientId}_notifications`,
  notification: {
    title: "Title",
    body: "Message",
  },
  webpush: {
    notification: {
      title: "Title",
      body: "Message",
    },
    fcmOptions: {
      link: "/",
    },
  },
};

const response = await admin.messaging().send(message);
// Returns: { messageId, success: true }
```

#### Option B: Individual Tokens (Fallback)
```typescript
// Send to individual token
const message = {
  token: fcmToken,
  notification: {
    title: "Title",
    body: "Message",
  },
  webpush: {
    notification: {
      title: "Title",
      body: "Message",
    },
    fcmOptions: {
      link: "/",
    },
  },
};

await admin.messaging().send(message);
```

#### Subscribing Token to Topic (Server-Side)
```typescript
// When saving token, also subscribe to topic
await admin.messaging().subscribeToTopic([token], `client${clientId}_notifications`);
```

### Firestore Integration
```typescript
// Initialize Firebase Admin
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!)
    ),
  });
}

const db = admin.firestore();
const clientId = 'client1'; // or from request

// Save FCM token and subscribe to topic
const token = 'fcm-token-here';
const collectionName = `fcm_tokens_${clientId}`;

await db.collection(collectionName).doc(token).set({
  token,
  clientId,
  createdAt: admin.firestore.FieldValue.serverTimestamp(),
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
}, { merge: true });

// Subscribe token to FCM topic (for efficient sending)
await admin.messaging().subscribeToTopic([token], `${clientId}_notifications`);

// Get subscriber count
const count = await db.collection(collectionName).count().get();
const subscriberCount = count.data().count;

// Remove invalid token and unsubscribe from topic
await db.collection(collectionName).doc(invalidToken).delete();
await admin.messaging().unsubscribeFromTopic([invalidToken], `${clientId}_notifications`);
```

### FCM Topics Integration (Recommended)
```typescript
// Send notification to all subscribers of a topic (NO Firestore reads!)
const message = {
  topic: `${clientId}_notifications`,
  notification: {
    title: "Title",
    body: "Message",
  },
  webpush: {
    notification: {
      title: "Title",
      body: "Message",
    },
    fcmOptions: {
      link: "/",
    },
  },
};

const response = await admin.messaging().send(message);
// One API call sends to ALL subscribers - efficient and cost-effective!
```

---

## ✅ Testing Checklist

- [ ] Landing page loads correctly
- [ ] "Allow Notifications" button works
- [ ] FCM token is saved to Firestore
- [ ] Subscriber count updates correctly (real-time)
- [ ] Admin panel is password protected
- [ ] Admin can send notifications to all subscribers
- [ ] Notifications are received on mobile devices
- [ ] Notifications are received on desktop browsers
- [ ] Clicking notification opens the website
- [ ] Service worker handles background notifications
- [ ] Invalid tokens are handled gracefully
- [ ] Mobile-responsive design works

---

## 🚀 Deployment Steps

1. **Create Vercel Project:**
   - Connect GitHub repository
   - Deploy to Vercel

2. **Add Environment Variables:**
   - Add all required environment variables in Vercel Dashboard
   - Redeploy after adding variables

3. **Verify Firebase Config:**
   - Ensure Firebase project ID matches in all places
   - Verify VAPID key is correct
   - Test FCM token generation
   - Verify Firestore is enabled and accessible
   - Test saving a token to Firestore manually

5. **Test End-to-End:**
   - Visit landing page
   - Subscribe to notifications
   - Send test notification from admin panel
   - Verify notification is received

---

## 📱 Multi-Client Support (20 Clients, Different Domains)

**Recommended Architecture: 20 Separate Firebase Projects** ✅

For different clients with different domains (.coms):
- **Each client gets their own:**
  - ✅ **Separate Firebase project** (complete isolation)
  - ✅ **Separate Firestore collection:** `fcm_tokens`
  - ✅ **Separate FCM topic:** `notifications`
  - ✅ **Separate service account**
  - ✅ **Same Vercel deployment** (with domain-based routing)

**Why Separate Projects?**
- ✅ **Security:** Complete data isolation per client
- ✅ **White-labeling:** Each domain has its own Firebase project
- ✅ **Compliance:** Better for data privacy regulations
- ✅ **Cost:** Actually cheaper (each project gets free tier!)
- ✅ **Client autonomy:** Can give clients their own Firebase console access

**Implementation:**
- Use domain-to-project mapping in `config/client-firebase-map.ts`
- Dynamic Firebase initialization based on request domain
- Environment variables per client: `FIREBASE_SERVICE_ACCOUNT_CLIENT1`, etc.
- See `ARCHITECTURE_DECISION.md` for detailed implementation

**Cost:** ~$0.00 (each project stays within free tier!)

---

## 🎨 Design Guidelines

- **Colors:** Professional, election-themed (blue, white, or client brand colors)
- **Typography:** Clear, readable fonts (system fonts or Google Fonts)
- **Layout:** Centered, single-column layout
- **Button:** Large, prominent CTA button for "Allow Notifications"
- **Mobile-First:** Ensure it works perfectly on mobile devices
- **Loading States:** Show loading indicators during async operations
- **Success States:** Clear confirmation when subscription succeeds

---

## 📚 Additional Notes

- **Service Worker:** Must be in `/public` folder, not `/app`
- **Firebase Config:** Never expose private keys in client-side code
- **Error Messages:** User-friendly, actionable error messages
- **Logging:** Comprehensive logging for debugging (use console.log)
- **Security:** Admin password should be strong in production
- **Rate Limiting:** Consider rate limiting for API routes in production
- **Analytics:** Optional: Add analytics to track subscriptions

---

## 🔧 Troubleshooting

Common issues and solutions:
- **"API key not valid"**: Check Firebase API key in environment variables
- **"Token not saved"**: Verify Firestore is enabled and service account has permissions
- **"Firestore permission denied"**: Check Firestore security rules (should be server-only)
- **"Notifications not received"**: Check service worker is registered, verify FCM token is valid
- **"Project ID mismatch"**: Ensure Firebase project ID matches in all configs
- **"Service worker not found"**: Ensure `firebase-messaging-sw.js` is in `/public` folder
- **"Collection not found"**: Ensure Firestore collection `fcm_tokens` exists (created automatically on first write)

---

## 📖 Documentation to Create

1. `SETUP_GUIDE.md` - Complete setup instructions
2. `ENVIRONMENT_VARIABLES.md` - List of all required env vars
3. `FIREBASE_SETUP.md` - Firebase & Firestore configuration steps
4. `DEPLOYMENT.md` - Vercel deployment guide
5. `TROUBLESHOOTING.md` - Common issues and solutions

---

## 💰 Cost Analysis

### For Small Scale (< 1,000 subscribers):
**Firebase Firestore Free Tier (Spark Plan):**
- ✅ 1 GB storage
- ✅ 50,000 reads/day
- ✅ 20,000 writes/day
- ✅ **Total Cost: $0/month**

### For Large Scale (20 clients × 35,000 followers):
**Firebase Blaze Plan (Pay-as-you-go) - Recommended:**

**With FCM Topics (Best Option):**
- ✅ Token writes: 700,000 (one-time) → ~$0.90
- ✅ Token reads: Minimal (only for counts) → $0.00
- ✅ FCM Topics: Unlimited subscribers, free → $0.00
- ✅ **Total Cost: ~$1 for 10 days** (20 clients)

**Without FCM Topics (Individual Tokens):**
- ❌ Token reads: 7,000,000 → ~$3.90
- ❌ Token writes: 700,000 → ~$0.90
- ❌ **Total Cost: ~$5 for 10 days**

**Firebase Cloud Messaging:**
- ✅ Unlimited notifications (free)
- ✅ FCM Topics: Free (unlimited subscribers)
- ✅ No per-message charges

**Vercel:**
- ✅ Free tier includes generous limits

**Result: ~$1 for 20 clients × 10 days with FCM Topics!** 🎯

**See `SCALING_ANALYSIS.md` for detailed calculations.**

---

**Start building this project step by step, ensuring each component works before moving to the next. Test thoroughly on both desktop and mobile devices before deploying to production.**
