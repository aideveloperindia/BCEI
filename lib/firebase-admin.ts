import '@opentelemetry/api'
import admin from 'firebase-admin'
import { getClientConfig } from '@/config/client-firebase-map'

const adminInstances: Map<string, admin.app.App> = new Map()

export function getFirebaseAdmin(domain: string): admin.app.App {
  // Return existing instance if available
  if (adminInstances.has(domain)) {
    return adminInstances.get(domain)!
  }

  // Get client config
  const config = getClientConfig(domain)
  if (!config) {
    throw new Error(`No Firebase config found for domain: ${domain}`)
  }

  // Get service account from environment variable
  const serviceAccountJson = process.env[config.serviceAccountEnv]
  if (!serviceAccountJson) {
    throw new Error(`Service account not found for domain: ${domain}. Check ${config.serviceAccountEnv} environment variable.`)
  }

  let serviceAccount
  try {
    serviceAccount = JSON.parse(serviceAccountJson)
  } catch (error) {
    throw new Error(`Invalid service account JSON for domain: ${domain}`)
  }

  // Initialize Firebase Admin
  try {
    const app = admin.initializeApp(
      {
        credential: admin.credential.cert(serviceAccount),
        projectId: config.projectId,
      },
      domain // Use domain as app name to allow multiple instances
    )

    adminInstances.set(domain, app)
    return app
  } catch (error) {
    // If app already exists, return it
    const existingApp = admin.app(domain)
    if (existingApp) {
      adminInstances.set(domain, existingApp)
      return existingApp
    }
    throw error
  }
}

export function getFirestore(domain: string) {
  const admin = getFirebaseAdmin(domain)
  return admin.firestore()
}

export function getMessaging(domain: string) {
  const admin = getFirebaseAdmin(domain)
  return admin.messaging()
}
