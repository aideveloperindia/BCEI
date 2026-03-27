'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { subscribeToNotifications, setupForegroundNotifications } from '@/lib/notificationManager'
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration'
import { getStoredLeadId } from '@/lib/admission-lead'
import { SiteNavbar } from '@/components/site/SiteNavbar'
import { fadeUp } from '@/lib/motion'

interface NewsItem {
  id: string
  title: string
  body: string
  createdAt: string
}

export default function Home() {
  const subscriberPhotos = [
    '/avatars/parent-1.jpg',
    '/avatars/parent-2.jpg',
    '/avatars/parent-3.jpg',
  ]

  const [showOpeningMessage, setShowOpeningMessage] = useState(true)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [latestNews, setLatestNews] = useState<NewsItem | null>(null)
  const [isLoadingNews, setIsLoadingNews] = useState(false)
  const [leadId, setLeadId] = useState<string | null>(null)

  useEffect(() => {
    setLeadId(getStoredLeadId())

    // Setup foreground notifications (when tab is open, FCM only triggers onMessage — we show the notification)
    setupForegroundNotifications((payload) => {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(payload?.notification?.title || 'Any School Fee Discount Update', {
          body: payload?.notification?.body,
          icon: '/logo.png',
        })
      }
    })

    // Check subscription status immediately on page load (no delay)
    const checkSubscriptionStatus = async () => {
      // Check if permission is granted first
      if ('Notification' in window && Notification.permission === 'granted') {
        // Try to get FCM token immediately
        try {
          const { getFCMToken } = await import('@/lib/firebase-client')
          
          // Wait for service worker (but with timeout)
          let swReady = false
          for (let i = 0; i < 10; i++) {
            const registration = await navigator.serviceWorker.getRegistration()
            if (registration && registration.active) {
              swReady = true
              break
            }
            await new Promise((r) => setTimeout(r, 200))
          }

          if (swReady) {
            const token = await getFCMToken()
            if (token) {
              // Verify token exists in Firestore
              const response = await fetch('/api/check-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
              })
              const data = await response.json()
              if (data.success && data.isSubscribed) {
                setIsSubscribed(true)
                fetchLatestNews()
                return
              }
            }
          }

          setIsSubscribed(false)
        } catch (error) {
          console.error('Error checking subscription:', error)
          setIsSubscribed(false)
        }
      }
    }

    // Check immediately (no delay)
    checkSubscriptionStatus()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowOpeningMessage(false)
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  const fetchLatestNews = async () => {
    setIsLoadingNews(true)
    try {
      const response = await fetch('/api/news')
      const data = await response.json()
      console.log('News API response:', data) // Debug log
      if (data.success && data.news && Array.isArray(data.news) && data.news.length > 0) {
        // Get the latest (first) news item
        setLatestNews(data.news[0])
        console.log('Latest news set:', data.news[0]) // Debug log
      } else {
        console.log('No news found or empty array:', data) // Debug log
        setLatestNews(null)
      }
    } catch (error) {
      console.error('Error fetching news:', error)
      setLatestNews(null)
    } finally {
      setIsLoadingNews(false)
    }
  }

  const handleAllowNotifications = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await subscribeToNotifications({ leadId: leadId || undefined })

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
        const retryResult = await subscribeToNotifications({ leadId: leadId || undefined })
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
    <main className="min-h-screen bg-background text-foreground">
      <ServiceWorkerRegistration />
      <SiteNavbar />
      {showOpeningMessage ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-6 backdrop-blur-md">
          <div className="max-w-4xl text-center">
            <p className="text-3xl font-semibold leading-tight text-white drop-shadow-lg md:text-5xl md:leading-tight">
              Get the best possible school fee discount - we negotiate with schools on your behalf.
            </p>
          </div>
        </div>
      ) : null}

      <section className="relative flex min-h-screen items-center justify-center px-4 pb-20 pt-28 md:pt-32">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-35"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260325_120549_0cd82c36-56b3-4dd9-b190-069cfc3a623f.mp4"
        />
        <div className="absolute bottom-0 h-64 w-full bg-gradient-to-t from-background to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-3xl space-y-8 text-center">
          <motion.div {...fadeUp(0)} className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
            <div className="-space-x-2 flex">
              {subscriberPhotos.map((avatar, index) => (
                <Image
                  key={index}
                  src={avatar}
                  alt="Subscriber avatar"
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full border-2 border-background object-cover"
                  unoptimized
                />
              ))}
            </div>
            <span>7,000+ parents already subscribed</span>
          </motion.div>

          <motion.h1
            {...fadeUp(0.05)}
            className="text-4xl font-medium tracking-[-1.5px] md:text-6xl lg:text-7xl"
          >
            Get the best possible school fee discount.{' '}
            <span className="font-serif italic font-normal">We negotiate for you.</span>
          </motion.h1>

          <motion.p
            {...fadeUp(0.1)}
            className="mx-auto max-w-2xl text-base text-[hsl(var(--hero-subtitle))] md:text-lg"
          >
            Join now to get discount-focused admission updates. Our team coordinates with schools and
            helps parents secure the best possible fee discount opportunities.
          </motion.p>
          <motion.p {...fadeUp(0.12)} className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-base">
            Planning to change your child&apos;s school? We support new admissions and help you secure
            the best possible fee discount.
          </motion.p>

          <motion.div {...fadeUp(0.15)} className="mx-auto max-w-lg">
            {isSubscribed ? (
              <div className="liquid-glass rounded-2xl p-5 text-left">
                <p className="mb-2 text-sm text-white/70">You are subscribed.</p>
                {isLoadingNews ? (
                  <p className="text-sm text-white/60">Loading latest news...</p>
                ) : latestNews ? (
                  <div className="space-y-3">
                    <h2 className="text-xl font-semibold">{latestNews.title}</h2>
                    <p className="text-sm text-white/80 whitespace-pre-wrap">{latestNews.body}</p>
                  </div>
                ) : (
                  <p className="text-sm text-white/70">No news updates yet. Check back soon.</p>
                )}
              </div>
            ) : leadId ? (
              <div className="liquid-glass rounded-3xl p-2">
                <button
                  onClick={handleAllowNotifications}
                  disabled={isLoading}
                  className="w-full rounded-full bg-foreground px-8 py-3 font-semibold text-background transition hover:scale-[1.02] disabled:opacity-50"
                >
                  {isLoading ? 'Setting up notifications...' : 'Allow Notifications'}
                </button>
                <p className="px-3 pt-3 text-center text-xs text-muted-foreground">
                  Final step to activate discount support and receive real-time fee update alerts.
                </p>
              </div>
            ) : (
              <Link
                href="/admission/start"
                className="inline-flex w-full items-center justify-center rounded-full bg-foreground px-8 py-3 font-semibold text-background transition hover:scale-[1.02]"
              >
                Get School Fee Discount Support
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      <section id="latest-updates" className="border-t border-border/30 px-4 py-20 md:py-28">
        <motion.div {...fadeUp(0)} className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl md:text-5xl">
            School fee discounts are possible. <span className="font-serif italic">Let us help you get them.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">
            School admissions made smarter: we help you secure the best possible fee discounts.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
            For parents changing schools: we help with new admission and fee discount support.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                title: 'Step 1: Register',
                desc: 'You focus on your child\'s future, we focus on negotiating better school fee discounts.',
              },
              {
                title: 'Step 2: Child Profile',
                desc: 'Your child\'s admission, your advantage - we work with schools to unlock fee discounts for you.',
              },
              {
                title: 'Step 3: Preferences',
                desc: 'Better admissions start here: expert support to negotiate school fee discounts for parents.',
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                {...fadeUp(index * 0.08)}
                className="liquid-glass rounded-2xl p-6 text-left"
              >
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
          {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
        </motion.div>
      </section>

      <footer className="border-t border-border/30 px-6 py-10 md:px-14">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 text-sm text-muted-foreground md:flex-row md:items-center">
          <p>© 2026 Any School Fee Discount. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/admission/benefits" className="hover:text-foreground">
              Benefits
            </Link>
            <Link href="/admission/start" className="hover:text-foreground">
              Start
            </Link>
            <Link href="/admin" className="hover:text-foreground">
              Admin
            </Link>
            <Link href="/school-admin" className="hover:text-foreground">
              School Admin
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
