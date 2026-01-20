'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { subscribeToNotifications, setupForegroundNotifications } from '@/lib/notificationManager'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'

export default function Home() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Register service worker
    // Check if already subscribed
    if ('Notification' in window && Notification.permission === 'granted') {
      setIsSubscribed(true)
    }

    // Setup foreground notifications
    setupForegroundNotifications((payload) => {
      console.log('Foreground notification received:', payload)
      // You can show a custom notification UI here if needed
    })
  }, [])

  const handleAllowNotifications = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await subscribeToNotifications()

      if (result.success) {
        setIsSubscribed(true)
      } else {
        setError(result.error || 'Failed to enable notifications')
      }
    } catch (err) {
      setError('Failed to enable notifications')
      console.error('Error subscribing to notifications:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <ServiceWorkerRegistration />
      <div className="flex flex-col items-center justify-center space-y-8 max-w-md w-full">
        {/* Logo - light circle so dark logo is visible on black background */}
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white flex items-center justify-center p-3 shadow-lg ring-2 ring-white/20">
          <Image
            src="/advocates-logo.png"
            alt="Advocates Logo"
            width={160}
            height={160}
            className="object-contain w-full h-full"
            priority
            unoptimized
          />
        </div>

        {/* Title */}
        <h1 className="text-white text-2xl md:text-3xl font-semibold text-center">
          Get Bar Council Election Updates
        </h1>

        {/* Button or Success Message */}
        {isSubscribed ? (
          <div className="text-center space-y-4">
            <div className="text-green-400 text-lg font-medium">
              ✓ You&apos;re subscribed!
            </div>
            <p className="text-white/70 text-sm">
              You&apos;ll receive important election updates
            </p>
          </div>
        ) : (
          <button
            onClick={handleAllowNotifications}
            disabled={isLoading}
            className="w-full bg-white text-black font-semibold py-4 px-8 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            {isLoading ? 'Loading...' : 'Allow Notifications'}
          </button>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-red-400 text-sm text-center">{error}</div>
        )}
      </div>
    </main>
  )
}
