'use client'

import { getFCMToken, requestNotificationPermission, onForegroundMessage, getFirebaseMessaging } from './firebase-client'

export interface NotificationState {
  isSubscribed: boolean
  isLoading: boolean
  error: string | null
}

async function waitForServiceWorker(maxWait = 10000): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false
  }

  const startTime = Date.now()
  while (Date.now() - startTime < maxWait) {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration && registration.active) {
      return true
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  return false
}

export async function subscribeToNotifications(): Promise<{
  success: boolean
  token: string | null
  error?: string
}> {
  try {
    // Check if service worker is supported (required for FCM)
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return {
        success: false,
        token: null,
        error: 'Service workers not supported. Please use a modern browser.',
      }
    }

    // Wait for service worker to be ready (especially important for iOS Safari)
    const swReady = await waitForServiceWorker(10000)
    if (!swReady) {
      return {
        success: false,
        token: null,
        error: 'Service worker not ready. Please refresh the page and try again.',
      }
    }

    // Request browser permission
    const hasPermission = await requestNotificationPermission()
    if (!hasPermission) {
      return {
        success: false,
        token: null,
        error: 'Notification permission denied. Please allow notifications in your browser settings.',
      }
    }

    // Get FCM token with multiple retries (service worker may need time to initialize Firebase)
    let token: string | null = null
    const maxRetries = 5
    for (let i = 0; i < maxRetries; i++) {
      token = await getFCMToken()
      if (token) break
      if (i < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 1000 * (i + 1))) // Increasing delay: 1s, 2s, 3s, 4s
      }
    }

    if (!token) {
      return {
        success: false,
        token: null,
        error: 'Failed to get FCM token. Please refresh the page and try again.',
      }
    }

    // Save token to server - CRITICAL: must complete before returning success
    // Add retry logic for quota errors (critical for 35,000 concurrent users)
    let saveRetries = 0
    const maxSaveRetries = 3
    let saveSuccess = false
    let saveError: string | null = null

    while (saveRetries < maxSaveRetries && !saveSuccess) {
      const response = await fetch('/api/save-fcm-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      if (response.ok) {
        const saveResult = await response.json().catch(() => ({}))
        if (saveResult.success) {
          saveSuccess = true
          break
        } else {
          saveError = saveResult.message || 'Failed to save token'
        }
      } else {
        const err = await response.json().catch(() => ({}))
        saveError = err.message || 'Failed to save token'
        
        // If it's a 503 (Service Unavailable / quota error), retry with backoff
        if (response.status === 503 && saveRetries < maxSaveRetries - 1) {
          const delay = 1000 * (saveRetries + 1) // 1s, 2s, 3s
          console.log(`Token save failed (quota error), retrying in ${delay}ms...`)
          await new Promise((r) => setTimeout(r, delay))
          saveRetries++
          continue
        }
      }

      // If not a retryable error, break immediately
      if (response.status !== 503) {
        break
      }
    }

    if (!saveSuccess) {
      return {
        success: false,
        token: null,
        error: saveError || 'Failed to save token after retries',
      }
    }

    // Token is now saved and verified - ready for immediate push
    console.log('Token saved and verified, ready for push:', token.substring(0, 20) + '...')

    return {
      success: true,
      token,
    }
  } catch (error) {
    console.error('Error subscribing to notifications:', error)
    return {
      success: false,
      token: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

export function setupForegroundNotifications(
  onNotification: (payload: any) => void
) {
  if (typeof window === 'undefined') return

  getFirebaseMessaging().then((messaging) => {
    if (!messaging) return

    onForegroundMessage((payload) => {
      console.log('Foreground message received:', payload)
      onNotification(payload)
    })
  })
}
