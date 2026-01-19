'use client'

import { getFCMToken, requestNotificationPermission, onForegroundMessage, getFirebaseMessaging } from './firebase-client'

export interface NotificationState {
  isSubscribed: boolean
  isLoading: boolean
  error: string | null
}

export async function subscribeToNotifications(): Promise<{
  success: boolean
  token: string | null
  error?: string
}> {
  try {
    // Request browser permission
    const hasPermission = await requestNotificationPermission()
    if (!hasPermission) {
      return {
        success: false,
        token: null,
        error: 'Notification permission denied',
      }
    }

    // Get FCM token
    const token = await getFCMToken()
    if (!token) {
      return {
        success: false,
        token: null,
        error: 'Failed to get FCM token',
      }
    }

    // Save token to server
    const response = await fetch('/api/save-fcm-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        token: null,
        error: error.message || 'Failed to save token',
      }
    }

    return {
      success: true,
      token,
    }
  } catch (error) {
    console.error('Error subscribing to notifications:', error)
    return {
      success: false,
      token: null,
      error: error instanceof Error ? error.message : 'Unknown error',
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
