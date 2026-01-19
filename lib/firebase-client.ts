'use client'

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging'
import { getClientConfig } from '@/config/client-firebase-map'

let messagingInstance: Messaging | null = null
let appInstance: FirebaseApp | null = null

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') return null

  if (appInstance) return appInstance

  const domain = window.location.hostname
  const config = getClientConfig(domain)

  if (!config) {
    console.error(`No Firebase config found for domain: ${domain}`)
    return null
  }

  // Check if app already initialized
  const existingApp = getApps().find(app => app.name === domain)
  if (existingApp) {
    appInstance = existingApp
    return appInstance
  }

  // Initialize Firebase with client config
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: config.projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  }

  try {
    appInstance = initializeApp(firebaseConfig, domain)
    return appInstance
  } catch (error) {
    console.error('Error initializing Firebase:', error)
    return null
  }
}

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null

  if (messagingInstance) return messagingInstance

  const app = getFirebaseApp()
  if (!app) return null

  try {
    messagingInstance = getMessaging(app)
    return messagingInstance
  } catch (error) {
    console.error('Error getting Firebase Messaging:', error)
    return null
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (!('Notification' in window)) return false

  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

export async function getFCMToken(): Promise<string | null> {
  try {
    const messaging = await getFirebaseMessaging()
    if (!messaging) return null

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    if (!vapidKey) {
      console.error('VAPID key not found')
      return null
    }

    const token = await getToken(messaging, { vapidKey })
    return token || null
  } catch (error) {
    console.error('Error getting FCM token:', error)
    return null
  }
}

export function onForegroundMessage(
  callback: (payload: any) => void
): (() => void) | null {
  if (typeof window === 'undefined') return null

  getFirebaseMessaging().then((messaging) => {
    if (!messaging) return null

    return onMessage(messaging, callback)
  })

  return null
}
