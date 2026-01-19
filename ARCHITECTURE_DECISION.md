# 🏗️ Architecture Decision: One vs Multiple Firebase Projects

## 📊 Your Situation
- **20 clients** with **different domains** (.coms)
- Each client has **35,000 followers**
- **10-day campaign** per client
- Need **complete isolation** and **white-labeling**

---

## 🎯 Option 1: One Firebase Project (All Clients)

### Architecture:
```
Single Firebase Project
├── Firestore Collections:
│   ├── fcm_tokens_client1
│   ├── fcm_tokens_client2
│   └── ... (20 collections)
├── FCM Topics:
│   ├── client1_notifications
│   ├── client2_notifications
│   └── ... (20 topics)
└── Single Service Account
```

### Pros:
- ✅ **Lower cost:** One project, shared free tier
- ✅ **Single management:** One Firebase console
- ✅ **Easier deployment:** One set of env vars (with client mapping)
- ✅ **Simpler code:** One Firebase config

### Cons:
- ❌ **Security risk:** If one client's admin is compromised, could access others
- ❌ **No isolation:** All clients share same Firebase project ID
- ❌ **White-labeling issues:** All clients see same Firebase project in network requests
- ❌ **Shared billing:** Can't bill clients separately
- ❌ **Single point of failure:** If project is suspended, all clients affected
- ❌ **Harder to give client access:** Can't give client their own Firebase console access

---

## 🎯 Option 2: 20 Separate Firebase Projects (Recommended) ✅

### Architecture:
```
Client 1: client1.com
├── Firebase Project: bar-council-client1
├── Firestore: fcm_tokens
├── FCM Topic: notifications
└── Service Account: client1-service-account

Client 2: client2.com
├── Firebase Project: bar-council-client2
├── Firestore: fcm_tokens
├── FCM Topic: notifications
└── Service Account: client2-service-account

... (20 projects)
```

### Pros:
- ✅ **Complete isolation:** Each client has their own project
- ✅ **Better security:** One client can't access another's data
- ✅ **True white-labeling:** Each domain has its own Firebase project
- ✅ **Independent billing:** Can track costs per client
- ✅ **Client access:** Can give each client their own Firebase console access
- ✅ **No cross-contamination:** Issues with one client don't affect others
- ✅ **Compliance:** Better for data privacy regulations (each client's data separate)
- ✅ **Scalability:** Can scale each client independently

### Cons:
- ❌ **More management:** 20 projects to set up
- ❌ **More env vars:** Need to map domain → Firebase project
- ❌ **Slightly more complex:** Need domain-based config lookup

### Cost:
- **Still ~$1 per client for 10 days** (with FCM Topics)
- **Total: ~$20 for all 20 clients × 10 days**
- Each project gets its own free tier, so most writes/reads are free!

---

## 🏆 Recommendation: 20 Separate Firebase Projects

### Why?
1. **Different domains = different brands** → Need complete isolation
2. **Security:** Can't risk one client accessing another's data
3. **White-labeling:** Each client should see their own Firebase project
4. **Compliance:** Better for data privacy (GDPR, etc.)
5. **Client autonomy:** Can give clients their own Firebase console access
6. **Cost is still minimal:** ~$1 per client, total ~$20

---

## 🛠️ Implementation Strategy

### 1. Domain-to-Project Mapping

Create a configuration file that maps domains to Firebase projects:

```typescript
// config/client-firebase-map.ts
export const clientFirebaseMap: Record<string, {
  projectId: string;
  serviceAccount: string;
  collectionName: string;
  topicName: string;
}> = {
  'client1.com': {
    projectId: 'bar-council-client1',
    serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT1!,
    collectionName: 'fcm_tokens',
    topicName: 'notifications',
  },
  'client2.com': {
    projectId: 'bar-council-client2',
    serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT2!,
    collectionName: 'fcm_tokens',
    topicName: 'notifications',
  },
  // ... 20 clients
};
```

### 2. Dynamic Firebase Initialization

```typescript
// lib/firebase-admin.ts
import admin from 'firebase-admin';
import { clientFirebaseMap } from '@/config/client-firebase-map';

const adminInstances: Map<string, admin.app.App> = new Map();

export function getFirebaseAdmin(domain: string): admin.app.App {
  if (adminInstances.has(domain)) {
    return adminInstances.get(domain)!;
  }

  const config = clientFirebaseMap[domain];
  if (!config) {
    throw new Error(`No Firebase config for domain: ${domain}`);
  }

  const app = admin.initializeApp(
    {
      credential: admin.credential.cert(
        JSON.parse(config.serviceAccount)
      ),
      projectId: config.projectId,
    },
    domain // Use domain as app name to allow multiple instances
  );

  adminInstances.set(domain, app);
  return app;
}
```

### 3. Environment Variables (Vercel)

```env
# Client 1
FIREBASE_SERVICE_ACCOUNT_CLIENT1={"type":"service_account",...}
NEXT_PUBLIC_FIREBASE_PROJECT_ID_CLIENT1=bar-council-client1
NEXT_PUBLIC_FIREBASE_API_KEY_CLIENT1=...
NEXT_PUBLIC_FIREBASE_VAPID_KEY_CLIENT1=...

# Client 2
FIREBASE_SERVICE_ACCOUNT_CLIENT2={"type":"service_account",...}
NEXT_PUBLIC_FIREBASE_PROJECT_ID_CLIENT2=bar-council-client2
NEXT_PUBLIC_FIREBASE_API_KEY_CLIENT2=...
NEXT_PUBLIC_FIREBASE_VAPID_KEY_CLIENT2=...

# ... 20 clients
```

### 4. Client-Side Config (Based on Domain)

```typescript
// lib/firebase-client.ts
export function getFirebaseConfig() {
  const domain = window.location.hostname;
  
  const configs: Record<string, any> = {
    'client1.com': {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY_CLIENT1,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_CLIENT1,
      // ... other config
    },
    // ... 20 clients
  };

  return configs[domain] || configs['client1.com']; // fallback
}
```

---

## 📋 Setup Checklist (20 Projects)

### Per Client (Repeat 20 times):
- [ ] Create Firebase project: `bar-council-client{id}`
- [ ] Enable Firestore (Native mode)
- [ ] Enable Cloud Messaging
- [ ] Create Web App
- [ ] Generate VAPID key
- [ ] Create Service Account
- [ ] Download service account JSON
- [ ] Set Firestore security rules
- [ ] Add environment variables to Vercel

### Deployment:
- [ ] Map domain to Firebase project in config
- [ ] Deploy to Vercel with all env vars
- [ ] Test each client domain
- [ ] Verify notifications work per client

---

## 💰 Cost Comparison

### Option 1: One Project
- **Writes:** 700,000 → ~$0.90
- **Reads:** Minimal → $0.00
- **Total:** ~$1 for all 20 clients

### Option 2: 20 Projects (Recommended)
- **Per client:** ~$0.05 (mostly free tier)
- **Total:** ~$1 for all 20 clients (each gets free tier!)
- **Actually cheaper** because each project gets its own free tier!

**With 20 projects:**
- Each project: 35,000 writes (within 20K/day free tier if spread over 2 days)
- Each project: Minimal reads (within 50K/day free tier)
- **Total cost: ~$0.00** (all within free tiers!)

---

## ✅ Final Recommendation

**Use 20 Separate Firebase Projects** because:

1. ✅ **Different domains = different brands** → Need isolation
2. ✅ **Security:** Complete data separation
3. ✅ **White-labeling:** Each client has their own Firebase
4. ✅ **Cost:** Actually cheaper (each project gets free tier)
5. ✅ **Scalability:** Can scale independently
6. ✅ **Compliance:** Better for data privacy
7. ✅ **Client autonomy:** Can give clients their own access

**The slight management overhead is worth it for security and isolation!**

---

## 🚀 Next Steps

1. Create 20 Firebase projects (can be automated with Firebase CLI)
2. Set up domain-to-project mapping
3. Implement dynamic Firebase initialization
4. Deploy with environment variable mapping
5. Test each client domain independently
