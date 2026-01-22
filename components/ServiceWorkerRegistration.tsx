'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker and wait for it to be ready
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js', { scope: '/' })
        .then((registration) => {
          console.log('Service Worker registered:', registration)
          
          // Wait for service worker to be active (especially important for iOS)
          if (registration.installing) {
            registration.installing.addEventListener('statechange', () => {
              if (registration.installing?.state === 'activated') {
                console.log('Service Worker activated')
              }
            })
          } else if (registration.waiting) {
            registration.waiting.addEventListener('statechange', () => {
              if (registration.waiting?.state === 'activated') {
                console.log('Service Worker activated')
              }
            })
          } else if (registration.active) {
            console.log('Service Worker already active')
          }
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }
  }, [])

  return null
}
