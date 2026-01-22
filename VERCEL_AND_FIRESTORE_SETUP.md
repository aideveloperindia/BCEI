# Firestore Database + Vercel Env Variables

## Part 1: Create Firestore Database (Firebase)

### Step 1: Open Firebase Console
1. Go to **https://console.firebase.google.com/**
2. Select project **bcei-b4627**

### Step 2: Open Firestore
1. In the left sidebar, click **Build** → **Firestore Database**

### Step 3: Create database
1. Click **"Create database"**
2. **Security rules:**
   - Choose **"Start in production mode"** (recommended).  
     Your app uses the **Firebase Admin SDK** (service account) on the server, which bypasses these rules. Clients cannot read/write directly.
3. **Location:**
   - Pick a region (e.g. **nam5 (us-central)** or one close to your users).  
     You cannot change it later.
4. Click **"Enable"**
5. Wait for Firestore to finish creating (usually under a minute).

### Step 4: (Optional) Firestore rules
1. Go to the **"Rules"** tab in Firestore.
2. You can use rules like this so only the server (Admin SDK) can access data:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **"Publish"**

> **Note:** With the above rules, only your backend (using the Service Account) can read/write. The web/mobile app does not talk to Firestore directly.

---

## Part 2: Vercel Environment Variables

### Where to add
1. Go to **https://vercel.com/dashboard**
2. Open your **BCEI** project
3. **Settings** → **Environment Variables**
4. Add each variable below. For **Environment**, enable at least **Production** (and **Preview** if you use preview deployments).

---

### List of variables (copy names; fill values from Firebase)

| # | Name | Value (where to get it) | Example / Note |
|---|-----|--------------------------|----------------|
| 1 | `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase: Project settings → Your apps → Web app → `apiKey` | `AIzaSy...` |
| 2 | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Same → `authDomain` | `bcei-b4627.firebaseapp.com` |
| 3 | `NEXT_PUBLIC_FIREBASE_PROJECT_ID_CLIENT1` | Same → `projectId` | `bcei-b4627` |
| 4 | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Same → `storageBucket` | `bcei-b4627.firebasestorage.app` |
| 5 | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Same → `messagingSenderId` | `711689554301` |
| 6 | `NEXT_PUBLIC_FIREBASE_APP_ID` | Same → `appId` | `1:711689554301:web:...` |
| 7 | `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Project settings → **Cloud Messaging** → Web Push certificates → Key pair | `BNrr_...` (long string) |
| 8 | `FIREBASE_SERVICE_ACCOUNT_CLIENT1` | Project settings → **Service accounts** → **Generate new private key** (JSON) → paste **entire** `{...}` | One line; include `{}` |
| 9 | `ADMIN_PASSWORD` | You choose (used for `/admin` and `/admin/push-notifications`) | e.g. `MyStr0ng!Pass` |

---

### 1–6: Firebase Web app config

- Firebase Console → ⚙️ **Project settings** → **Your apps** → your Web app.
- Copy each field into the matching variable.

### 7: VAPID key

- **Project settings** → **Cloud Messaging** → **Web Push certificates**.
- Copy the **Key pair** (or create one). Paste as `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.

### 8: Service Account JSON (most important)

1. **Project settings** → **Service accounts**.
2. **Generate new private key** → **Generate key**.
3. Open the downloaded `.json` file.
4. Select all (from `{` to `}`) and copy.
5. In Vercel, create `FIREBASE_SERVICE_ACCOUNT_CLIENT1` and paste that **entire** JSON as the value.
   - One line is fine (no need for real line breaks).
   - Do **not** add extra quotes around the JSON.
   - Must be valid JSON (starts with `{`, ends with `}`).

### 9: Admin password

- Any strong password you want for the admin area.  
- Set the same in `.env.local` if you run the app locally.

---

### After adding in Vercel

1. **Redeploy** the project (e.g. **Deployments** → ⋮ on latest → **Redeploy**, or push a new commit).
2. Env vars are applied on the **next** build; existing deployments keep the old values.

---

### Check your Vercel domain in the app

Your app decides which Firebase project to use from the **hostname** (e.g. `bcei.vercel.app` or `bcei-xyz.vercel.app`).

- If your live URL is **`bcei.vercel.app`**, it’s already in `config/client-firebase-map.ts`; no change needed.
- If it’s different (e.g. `bcei-git-aideveloperindia.vercel.app`), that host must be added to `client-firebase-map.ts` with the same `projectId`, `serviceAccountEnv`, `collectionName`, `topicName`, and `branding` as the `bcei.vercel.app` entry.

---

## Quick checklist

**Firestore**

- [ ] Firestore database created in project **bcei-b4627**
- [ ] **Cloud Firestore API** enabled:  
  https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=bcei-b4627  
  (Click **Enable** if it’s not.)

**Vercel env**

- [ ] All 9 variables added (names exactly as in the table).
- [ ] `FIREBASE_SERVICE_ACCOUNT_CLIENT1` = full JSON, valid, one line.
- [ ] `ADMIN_PASSWORD` set.

**App config**

- [ ] Your real Vercel host (e.g. `bcei.vercel.app`) is a key in `config/client-firebase-map.ts`.

**Deploy**

- [ ] Redeploy after changing env vars.
