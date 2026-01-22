'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { subscribeToNotifications, setupForegroundNotifications } from '@/lib/notificationManager'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'

interface NewsItem {
  id: string
  title: string
  body: string
  createdAt: string
}

export default function Home() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [latestNews, setLatestNews] = useState<NewsItem | null>(null)
  const [isLoadingNews, setIsLoadingNews] = useState(false)

  useEffect(() => {
    // Setup foreground notifications (when tab is open, FCM only triggers onMessage — we show the notification)
    setupForegroundNotifications((payload) => {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(payload?.notification?.title || 'Bar Council Update', {
          body: payload?.notification?.body,
          icon: '/advocates-logo.png',
        })
      }
    })

    // If permission already granted, ensure we have a token saved (fixes "0 subscribers")
    // Wait a bit for service worker to be ready
    if ('Notification' in window && Notification.permission === 'granted') {
      setTimeout(() => {
        subscribeToNotifications()
          .then((r) => {
            setIsSubscribed(r.success)
            if (r.success) {
              // Fetch latest news when subscribed
              fetchLatestNews()
            }
            if (!r.success && r.error) {
              console.warn('Auto-subscribe failed:', r.error)
            }
          })
          .catch((err) => {
            console.error('Auto-subscribe error:', err)
            setIsSubscribed(false)
          })
      }, 2000) // Wait 2s for service worker to initialize
    }
  }, [])

  const fetchLatestNews = async () => {
    setIsLoadingNews(true)
    try {
      const response = await fetch('/api/news')
      const data = await response.json()
      if (data.success && data.news && data.news.length > 0) {
        // Get the latest (first) news item
        setLatestNews(data.news[0])
      }
    } catch (error) {
      console.error('Error fetching news:', error)
    } finally {
      setIsLoadingNews(false)
    }
  }

  const handleAllowNotifications = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await subscribeToNotifications()

      if (result.success) {
        setIsSubscribed(true)
        setError(null)
        // Fetch latest news when user subscribes
        fetchLatestNews()
      } else {
        // Don't show error to user - just keep loading state and retry silently
        console.error('Subscription failed:', result.error)
        // Retry once after a delay
        await new Promise((r) => setTimeout(r, 2000))
        const retryResult = await subscribeToNotifications()
        if (retryResult.success) {
          setIsSubscribed(true)
        } else {
          // Still failed - show friendly message, not error
          setIsSubscribed(false)
          console.error('Retry also failed:', retryResult.error)
        }
      }
    } catch (err) {
      // Don't show error - just log it
      console.error('Error subscribing to notifications:', err)
      setIsSubscribed(false)
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

        {/* Button or News Content (only for subscribed users) */}
        {isSubscribed ? (
          <div className="w-full space-y-6">
            {isLoadingNews ? (
              <div className="text-white/50 text-center py-8">Loading news...</div>
            ) : latestNews ? (
              <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
                <div className="text-green-400 text-sm font-medium mb-2">
                  ✓ You&apos;re subscribed
                </div>
                <div className="space-y-3">
                  <h2 className="text-white text-xl font-semibold">{latestNews.title}</h2>
                  <div className="text-white/80 text-sm whitespace-pre-wrap leading-relaxed">
                    {latestNews.body}
                  </div>
                  {latestNews.createdAt && (
                    <div className="text-white/40 text-xs pt-2 border-t border-white/10">
                      {new Date(latestNews.createdAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="text-green-400 text-lg font-medium">
                  ✓ You&apos;re subscribed!
                </div>
                <p className="text-white/70 text-sm">
                  You&apos;ll receive important election updates
                </p>
                <p className="text-white/50 text-xs">
                  No news updates yet. Check back soon!
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full space-y-2">
            <button
              onClick={handleAllowNotifications}
              disabled={isLoading}
              className="w-full bg-white text-black font-semibold py-4 px-8 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {isLoading ? 'Setting up notifications...' : 'Allow Notifications'}
            </button>
            {isLoading && (
              <p className="text-white/50 text-xs text-center">
                Please wait, this may take a few seconds...
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
