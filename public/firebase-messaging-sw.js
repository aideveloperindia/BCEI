// Service Worker for Firebase Cloud Messaging
// This file must be in the /public folder

importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js')

// Fetch Firebase config from API
self.addEventListener('install', (event) => {
  self.skipWaiting() // Activate immediately
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim()) // Take control of all pages
})

// Fetch config and initialize Firebase (no cache so we get fresh config)
fetch('/api/firebase-config', { cache: 'no-store' })
  .then((response) => response.json())
  .then((data) => {
    if (!data.success || !data.config) {
      console.error('Failed to get Firebase config')
      return
    }

    const config = data.config

    // Initialize Firebase
    firebase.initializeApp(config)

    // Get messaging instance
    const messaging = firebase.messaging()

    // Handle background messages
    messaging.onBackgroundMessage((payload) => {
      console.log('Background message received:', payload)

      const notificationTitle = payload.notification?.title || 'Bar Council Update'
      const notificationOptions = {
        body: payload.notification?.body || 'You have a new update',
        icon: '/advocates-logo.png',
        badge: '/advocates-logo.png',
        tag: 'bar-council-notification',
        requireInteraction: false,
        data: {
          url: payload.fcmOptions?.link || '/',
        },
      }

      return self.registration.showNotification(notificationTitle, notificationOptions)
    })

    // Handle notification clicks
    self.addEventListener('notificationclick', (event) => {
      console.log('Notification clicked:', event)
      event.notification.close()

      const urlToOpen = event.notification.data?.url || '/'

      event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
          // Check if there's already a window open
          for (let i = 0; i < clientList.length; i++) {
            const client = clientList[i]
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus()
            }
          }
          // If no window is open, open a new one
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen)
          }
        })
      )
    })
  })
  .catch((error) => {
    console.error('Error initializing Firebase in service worker:', error)
  })
