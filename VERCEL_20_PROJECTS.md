# 20 projects under one Vercel Pro account

## Why separate projects per client

**Limits are per project.** Rate limits, serverless invocations, bandwidth, and build minutes are tracked per project. If one client’s traffic or usage spikes, only that project is affected. Other clients keep their own quota. You avoid one client causing limit hits for the rest.

## Your setup

- **One** Vercel Pro account
- **20+ projects** (one per client) — limits isolated, less confusion
- **Same repo** deployed to each project
- **One domain per project** (each client’s site)

## Per project (each client)

1. **Create a new project** in the same Vercel team, “Import” the same GitHub repo.
2. **Add the client’s domain** in Project → Settings → Domains.
3. **Env vars** for that client (each project has its own env):
   - `ADMIN_PASSWORD` — your admin password
   - `NEXT_PUBLIC_FIREBASE_*` — same Firebase project is ok
   - `FIREBASE_SERVICE_ACCOUNT_CLIENT1` — same service account is ok if you use one Firebase
   - For **per-client data**: use a **unique `collectionName`** per client. That means either:
     - **Option A:** One Firebase project, many collections: `fcm_tokens_client1`, `fcm_tokens_client2`, … Set `COLLECTION_NAME=fcm_tokens_client1` in env and have the app read it when the in-code `client-firebase-map` has no entry for that domain.
     - **Option B:** One Firebase project, one `fcm_tokens` collection, and a `clientId` (or `domain`) field on each token and each log. Every API filters by the request’s domain. Then you don’t need per-project `COLLECTION_NAME`; you need `client-firebase-map` to have that project’s single domain.

## Easiest path today (no code change)

- **One Firebase project**, one `fcm_tokens` collection.
- In **code**, keep `client-firebase-map` with **all** client domains. Each project’s deployment will have the same code, but when you visit **that project’s domain**, `getClientConfig(domain)` returns that client’s entry.
- **Caveat:** with the same repo and same `client-firebase-map` in code, every project would have **all** domains in the map. That’s ok: each project is only ever hit on **its** domain (the one you added in Settings → Domains). So only that one entry is used. You still need a **different `collectionName` per client** so data is isolated. So in the map, for client1.com you’d have `collectionName: 'fcm_tokens_client1'`, for client2.com `fcm_tokens_client2`, etc. The map in code would list all 20. Each Vercel project is identical; the **domain you assign** to that project determines which map entry is used. So: **one repo, one deployed codebase, 20 projects, each with a different domain.** The `client-firebase-map` has 20 entries, one per domain. Each project is given exactly one domain in Vercel. When a request comes in, `Host` is that one domain, so we use that client’s `collectionName`. No per-project env for collection is needed if the map in code has all clients. The only per-project env you might want: `ADMIN_PASSWORD` (can be same) and Firebase (can be same). So you can actually deploy the **same** project 20 times: duplicate the project in Vercel, point to same repo, and only change the **domain** in each. Each project gets one domain. The code with the full map works. You just need to **add each new client’s domain to the map in code** and redeploy **all** projects (or only the one you use for that client if you’re ok with projects having the full map). Actually: if each of the 20 projects has a **different** domain, then each project only receives traffic for that domain. The map can have 20 entries. All 20 projects have the same code and same 20-entry map. When project A (domain client1.com) gets a request, Host=client1.com, we use client1’s config. When project B (domain client2.com) gets a request, we use client2’s. So **no per-project env for collection or domain is strictly needed** — only ensure each Vercel project has **one** domain and that domain exists in the map. For Firebase, if all use the same project and same service account, the same env across projects is fine. For `notification_logs`, we filter by `domain`, so each client’s logs are isolated. Done.

## Summary

- One Pro account, 20 projects, same repo, same env (Firebase, ADMIN_PASSWORD) if you use one Firebase.
- Each project: add exactly **one** domain (the client’s).
- In code: `client-firebase-map` has one entry per client domain, each with a **unique `collectionName`**.
- When you add client 21: add domain to the map, redeploy the **one** project that will serve that domain. (You can have one “main” project that you add new domains to, and only create a new Vercel project when you want strict isolation. For 20 separate projects, add the new domain to the map and redeploy **all** 20 projects so they all have the latest map. Or you maintain 20 separate repos/branches each with a single-domain map — more work.)

## One project vs many (for reference)

- **One project, 20 domains:** All clients share one project’s limits. One heavy client can affect others.
- **20 projects, 20 domains (your choice):** Limits are per project. One client cannot trigger rate or limit hits for the others.
