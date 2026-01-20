# Firebase Setup — Where to Get Every Value (Step by Step)

Follow these in order. All links open the [Firebase Console](https://console.firebase.google.com/).

---

## Before You Start

1. Go to **https://console.firebase.google.com/**
2. Sign in with Google.
3. **Create a project** (or pick an existing one):
   - Click **“Add project”** / **“Create a project”**
   - Name it (e.g. `bar-council-bcei`)
   - Disable Google Analytics if you don’t need it
   - Click **“Create project”**

4. In the left sidebar, click the **⚙️ (gear)** next to “Project Overview” → **“Project settings”**.

You’ll need this page for almost everything below.

---

## Part 1: Public Firebase Config (NEXT_PUBLIC_* and projectId)

These come from **one place**: your **Web app** in Project settings.

### 1.1 Open “Your apps”

1. In **Project settings**, scroll to **“Your apps”**.
2. If you see a **Web** app (`</>`):
   - Click it and you’ll see: `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`.
3. If you **don’t** have a Web app yet:
   - Click the **`</>`** (Web) icon.
   - Register the app (nickname like “BCEI Web”).
   - Click **“Register app”**.
   - You can skip the “Add Firebase SDK” step and go to **“Continue to console”**.

### 1.2 Copy each value

In the Web app card you’ll see something like:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123..."
};
```

| What you see in Firebase | Use it for this env variable | Example |
|--------------------------|------------------------------|---------|
| `apiKey` | `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyB...` |
| `authDomain` | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `bar-council-bcei.firebaseapp.com` |
| `projectId` | `NEXT_PUBLIC_FIREBASE_PROJECT_ID_CLIENT1` (and for `client-firebase-map`) | `bar-council-bcei` |
| `storageBucket` | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `bar-council-bcei.appspot.com` |
| `messagingSenderId` | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `123456789012` |
| `appId` | `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:123456789012:web:abc123...` |

Copy each into your `.env.local` or Vercel with the variable names in the table.

---

## Part 2: VAPID Key (NEXT_PUBLIC_FIREBASE_VAPID_KEY)

This is used for **web push** (notifications in the browser).

### 2.1 Open Cloud Messaging

1. Stay in **Project settings** (gear → Project settings).
2. Open the **“Cloud Messaging”** tab at the top.

### 2.2 Find “Web Push certificates”

1. Scroll down to **“Web Push certificates”**.
2. If you see **“Key pair”** with a long string (e.g. `BNxG...`):
   - Copy that entire string.
   - Use it as: **`NEXT_PUBLIC_FIREBASE_VAPID_KEY`**
3. If it says **“Generate key pair”**:
   - Click **“Generate key pair”**.
   - Copy the new key and use it as **`NEXT_PUBLIC_FIREBASE_VAPID_KEY`**.

---

## Part 3: Service Account JSON (FIREBASE_SERVICE_ACCOUNT_CLIENT1)

This is a **secret**; it must only exist in server env (e.g. Vercel), never in client code.

### 3.1 Open Service Accounts

1. In **Project settings**, go to the **“Service accounts”** tab at the top.
2. You’ll see a “Firebase Admin SDK” section and a table of service accounts.

### 3.2 Create and download the key

1. Click **“Generate new private key”** (or “Manage service account permissions” → pick the default service account → “Keys” → “Add key” → “Create new key”).
2. In the popup, choose **“JSON”**.
3. Click **“Generate key”**.
4. A JSON file will download (e.g. `your-project-firebase-adminsdk-xxxxx.json`).

### 3.3 Use it as an env variable

1. Open that JSON file in a text editor.
2. The whole file is one JSON object, e.g.:
   ```json
   {
     "type": "service_account",
     "project_id": "bar-council-bcei",
     "private_key_id": "...",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
     "client_email": "firebase-adminsdk-xxxxx@bar-council-bcei.iam.gserviceaccount.com",
     "client_id": "...",
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     "token_uri": "https://oauth2.googleapis.com/token",
     "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
     "client_x509_cert_url": "..."
   }
   ```
3. Copy the **entire contents** (from `{` to `}`).
4. For **Vercel**:
   - In **Project → Settings → Environment Variables**, create:
     - **Name:** `FIREBASE_SERVICE_ACCOUNT_CLIENT1`
     - **Value:** paste the full JSON (as one line is fine).
   - Add it to **Production** (and Preview/Development if you use them).

Do **not** commit this file or put it in client-side code. Only in server env vars.

---

## Part 4: Enable Firestore and (optionally) Cloud Messaging

### 4.1 Firestore (required)

1. Left sidebar → **“Build”** → **“Firestore Database”**.
2. Click **“Create database”**.
3. Choose **“Start in production mode”** (or test mode for local dev; you’ll set rules next).
4. Pick a region (e.g. `us-central1`) → **“Enable”**.

### 4.2 Firestore rules (for FCM tokens)

1. In Firestore, open the **“Rules”** tab.
2. Use rules that only allow server (Admin SDK) to read/write, e.g.:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

(Your app uses the Admin SDK with the service account, so it bypasses these rules. This blocks direct client access.)

3. Click **“Publish”**.

### 4.3 Cloud Messaging (FCM)

- FCM is on by default for Firebase.
- If you use **Cloud Messaging** in the left sidebar, there’s nothing else you must enable for web push besides the **VAPID key** (Part 2).

---

## Quick Checklist

| # | Variable | Where in Firebase |
|---|----------|-------------------|
| 1 | `NEXT_PUBLIC_FIREBASE_API_KEY` | Project settings → Your apps → Web app → `apiKey` |
| 2 | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Same → `authDomain` |
| 3 | `NEXT_PUBLIC_FIREBASE_PROJECT_ID_CLIENT1` | Same → `projectId` |
| 4 | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Same → `storageBucket` |
| 5 | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Same → `messagingSenderId` |
| 6 | `NEXT_PUBLIC_FIREBASE_APP_ID` | Same → `appId` |
| 7 | `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Project settings → Cloud Messaging → Web Push certificates → Key pair |
| 8 | `FIREBASE_SERVICE_ACCOUNT_CLIENT1` | Project settings → Service accounts → Generate new private key (JSON) → paste full JSON |

---

## After You Have Everything

1. Put these in **Vercel**: Project → Settings → Environment Variables.
2. Add `ADMIN_PASSWORD` (your chosen admin password).
3. Redeploy the project so the new env vars are picked up.
4. Make sure your **Vercel domain** (e.g. `yourapp.vercel.app`) is in `config/client-firebase-map.ts` for the domain that will call your app.

If you tell me your Firebase project name and whether you use `yourapp.vercel.app` or a custom domain, I can give you the exact `client-firebase-map` entry to add.
