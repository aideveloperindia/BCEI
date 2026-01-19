# Bar Council Election Notifications

Multi-client push notification system for Bar Council Elections. Supports 20 clients with different domains, each with their own Firebase project.

## 🎨 Design

- **Background:** Completely black
- **Logo:** Advocates logo (already added to `/public/advocates-logo.png`)
- **Text:** "Get Bar Council Election Updates"
- **Button:** "Allow Notifications"

Minimal and clean design!

## ✨ Features

- ✅ Simple landing page with logo and subscription button
- ✅ Firebase Cloud Messaging (FCM) integration
- ✅ Firestore for token storage (free tier)
- ✅ FCM Topics for efficient notification delivery
- ✅ Admin panel for sending notifications
- ✅ Password-protected admin routes
- ✅ Multi-client support (20 clients, different domains)
- ✅ Service worker for background notifications
- ✅ Mobile-responsive design

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Firebase credentials.

See `SETUP.md` for detailed setup instructions.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
BCEI/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── admin/
│   │   ├── page.tsx                # Admin login
│   │   └── push-notifications/
│   │       └── page.tsx            # Admin panel
│   └── api/
│       ├── save-fcm-token/         # Save token to Firestore
│       ├── send-push-notification/ # Send notifications
│       ├── get-subscriber-count/   # Get subscriber count
│       └── firebase-config/        # Firebase config for SW
├── components/
│   ├── AdminProtection.tsx         # Admin route protection
│   └── ServiceWorkerRegistration.tsx
├── config/
│   └── client-firebase-map.ts      # Domain → Firebase mapping
├── lib/
│   ├── firebase-client.ts          # Client-side Firebase
│   ├── firebase-admin.ts           # Server-side Firebase
│   └── notificationManager.ts     # Notification logic
├── public/
│   ├── advocates-logo.png          # Logo (already added)
│   └── firebase-messaging-sw.js    # Service worker
└── package.json
```

## 🎯 Usage

### For Users
1. Visit the landing page
2. Click "Allow Notifications"
3. Receive push notifications

### For Admins
1. Visit `/admin`
2. Login with admin password
3. Go to `/admin/push-notifications`
4. Enter title and message
5. Click "Send to All Subscribers"

## 🔧 Configuration

### Add Clients

Edit `config/client-firebase-map.ts` and add your client domains:

```typescript
export const clientFirebaseMap = {
  'client1.com': {
    projectId: 'bar-council-client1',
    serviceAccountEnv: 'FIREBASE_SERVICE_ACCOUNT_CLIENT1',
    // ...
  },
  // Add more clients...
};
```

### Environment Variables

See `.env.local.example` for all required variables.

## 📚 Documentation

- `SETUP.md` - Complete setup guide
- `ARCHITECTURE_DECISION.md` - Architecture decisions
- `SCALING_ANALYSIS.md` - Cost and scaling analysis
- `DEPLOYMENT_STRATEGY.md` - Deployment guide

## 🚀 Deployment

1. Push code to Git repository
2. Create Vercel project
3. Add all 20 domains to Vercel project
4. Add all environment variables
5. Deploy!

See `DEPLOYMENT_STRATEGY.md` for details.

## 💰 Cost

- **Firestore:** Free tier (1GB, 50K reads/day, 20K writes/day)
- **FCM:** Free (unlimited notifications)
- **Vercel:** Free tier
- **Total:** ~$0-1 for 20 clients × 10 days

## 📝 Notes

- Logo is already added to `/public/advocates-logo.png`
- Each client needs their own Firebase project
- All clients share the same codebase
- Domain-based routing handles client separation
- Complete isolation between clients
