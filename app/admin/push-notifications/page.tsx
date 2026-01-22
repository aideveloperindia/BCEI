'use client'

import { useState, useEffect } from 'react'
import { AdminProtection } from '@/components/AdminProtection'
import Image from 'next/image'
import Link from 'next/link'

export default function PushNotificationsPage() {
  return (
    <AdminProtection>
      <PushNotificationsContent />
    </AdminProtection>
  )
}

function PushNotificationsContent() {
  const [title, setTitle] = useState('Important Bar Council News')
  const [body, setBody] = useState('Stay updated with latest information')
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    subscriberCount?: number
    totalBatches?: number
    batchResults?: Array<{ batchNumber: number; successCount: number; failedCount: number }>
    failedTokensCount?: number
    logId?: string
  } | null>(null)
  const [lastSendData, setLastSendData] = useState<{
    title: string
    body: string
    logId?: string
    failedTokensCount?: number
  } | null>(null)
  const [sendingProgress, setSendingProgress] = useState<{
    isSending: boolean
    totalBatches?: number
    message?: string
  } | null>(null)
  const [stats, setStats] = useState<{
    totalSent: number
    sentToday: number
    sentThisWeek: number
    sentThisMonth: number
    successful: number
    failed: number
    successRate: string
    totalSubscribersReached: number
  } | null>(null)
  const [recentLogs, setRecentLogs] = useState<any[]>([])
  const [showAnalytics, setShowAnalytics] = useState(false)

  useEffect(() => {
    // Clean up invalid tokens on page load (silent, no UI feedback needed)
    const cleanupInvalidTokens = async () => {
      try {
        const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'
        await fetch('/api/cleanup-invalid-tokens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: adminPassword }),
        }).catch(() => {}) // Silent fail
      } catch (error) {
        // Silent - don't show errors to user
      }
    }
    cleanupInvalidTokens()

    fetchSubscriberCount()
    fetchStats()
    // Warm serverless + Firebase so first Send is faster
    fetch('/api/warm').catch(() => {})

    // Refresh subscriber count every 5 seconds (real-time updates)
    const interval = setInterval(() => {
      fetchSubscriberCount()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const fetchSubscriberCount = async () => {
    try {
      const response = await fetch('/api/get-subscriber-count')
      const data = await response.json()
      if (data.success) {
        setSubscriberCount(data.count)
      }
    } catch (error) {
      console.error('Error fetching subscriber count:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/get-notification-stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.stats)
        setRecentLogs(data.recentLogs || [])
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSending(true)
    setResult(null)
    
    // Show progress message if we have subscriber count
    if (subscriberCount && subscriberCount > 0) {
      const estimatedBatches = Math.ceil(subscriberCount / 500)
      setSendingProgress({
        isSending: true,
        totalBatches: estimatedBatches,
        message: `Sending to ${subscriberCount.toLocaleString()} subscribers in ${estimatedBatches} batches...`,
      })
    }

    try {
      const response = await fetch('/api/send-push-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          body,
          sendToAll: true,
        }),
      })

      const data = await response.json().catch(() => ({}))
      const ok = response.ok && data?.success

      if (ok) {
        const n = data.subscriberCount ?? 0
        setResult({
          success: true,
          message: n ? `Sent to ${n.toLocaleString()} subscriber${n === 1 ? '' : 's'}.` : 'Sent.',
          subscriberCount: data.subscriberCount,
          totalBatches: data.totalBatches,
          batchResults: data.batchResults,
          failedTokensCount: data.failedTokensCount,
          logId: data.logId,
        })
        // Store send data for retry capability
        setLastSendData({
          title,
          body,
          logId: data.logId,
          failedTokensCount: data.failedTokensCount,
        })
        fetchSubscriberCount()
        fetchStats()
      } else {
        setResult({
          success: false,
          message: data?.message || (response.ok ? 'Failed to send' : `Request failed (${response.status}). Try again.`),
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Request failed or timed out. Try again—the next attempt is often faster.',
      })
      console.error('Error sending notification:', error)
    } finally {
      setIsSending(false)
      setSendingProgress(null)
    }
  }

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center justify-center space-y-8 max-w-2xl w-full">
        {/* Logo - light circle so dark logo is visible on black background */}
        <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center p-2 shadow-lg ring-2 ring-white/20">
          <Image
            src="/advocates-logo.png"
            alt="Advocates Logo"
            width={96}
            height={96}
            className="object-contain w-full h-full"
            priority
            unoptimized
          />
        </div>

        {/* Title */}
        <div className="flex items-center justify-between w-full">
          <h1 className="text-white text-2xl font-semibold">
            Send Push Notification
          </h1>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/news"
              className="text-white/70 hover:text-white text-sm underline"
            >
              News
            </Link>
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="text-white/70 hover:text-white text-sm underline"
            >
              {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
            </button>
          </div>
        </div>

        {/* Analytics Section */}
        {showAnalytics && stats && (
          <div className="w-full bg-white/5 border border-white/10 rounded-lg p-6 space-y-4">
            <h2 className="text-white text-lg font-semibold mb-4">Analytics</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-white/70 text-sm">Total Sent</div>
                <div className="text-white text-2xl font-bold">{stats.totalSent}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-white/70 text-sm">Today</div>
                <div className="text-white text-2xl font-bold">{stats.sentToday}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-white/70 text-sm">This Week</div>
                <div className="text-white text-2xl font-bold">{stats.sentThisWeek}</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-white/70 text-sm">This Month</div>
                <div className="text-white text-2xl font-bold">{stats.sentThisMonth}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-white/70 text-sm">Success Rate</div>
                <div className="text-green-400 text-2xl font-bold">{stats.successRate}</div>
                <div className="text-white/50 text-xs mt-1">
                  {stats.successful} successful, {stats.failed} failed
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-white/70 text-sm">Total Reached</div>
                <div className="text-white text-2xl font-bold">
                  {stats.totalSubscribersReached.toLocaleString()}
                </div>
                <div className="text-white/50 text-xs mt-1">Subscribers</div>
              </div>
            </div>

            {/* Recent Notifications */}
            {recentLogs.length > 0 && (
              <div className="mt-6">
                <h3 className="text-white font-semibold mb-3">Recent Notifications</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="bg-white/5 rounded-lg p-3 border border-white/10"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-white font-medium text-sm">{log.title}</div>
                          <div className="text-white/60 text-xs mt-1 line-clamp-1">
                            {log.body}
                          </div>
                          <div className="text-white/40 text-xs mt-2">
                            {new Date(log.sentAt).toLocaleString()} • {log.subscriberCount || 0} subscribers
                          </div>
                        </div>
                        <div
                          className={`ml-2 px-2 py-1 rounded text-xs ${
                            log.success
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {log.success ? '✓' : '✗'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Subscriber Count */}
        {subscriberCount !== null && (
          <div className="text-white/70 text-center">
            Total Subscribers: <span className="text-white font-semibold">{subscriberCount.toLocaleString()}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSendNotification} className="w-full space-y-4">
          <div>
            <label className="block text-white/70 text-sm mb-2">
              Notification Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/10 text-white placeholder-white/50 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-white/40"
              required
              disabled={isSending}
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">
              Notification Message
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full bg-white/10 text-white placeholder-white/50 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-white/40 resize-none"
              required
              disabled={isSending}
            />
          </div>

          <button
            type="submit"
            disabled={isSending}
            className="w-full bg-white text-black font-semibold py-4 px-8 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? 'Sending...' : 'Send to All Subscribers'}
          </button>
        </form>

        {/* Sending Progress */}
        {sendingProgress && sendingProgress.isSending && (
          <div className="w-full bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
            <div className="text-blue-400 font-semibold text-center mb-2">
              {sendingProgress.message || 'Sending notifications...'}
            </div>
            {sendingProgress.totalBatches && (
              <div className="text-blue-300 text-sm text-center">
                Processing {sendingProgress.totalBatches} batches (this may take 2-3 minutes for large subscriber counts)
              </div>
            )}
            <div className="mt-3 w-full bg-white/10 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div
            className={`text-center p-4 rounded-lg ${
              result.success
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            <div className="font-semibold mb-2">{result.message}</div>
            {result.success && result.totalBatches && result.batchResults && (
              <div className="mt-3 text-sm text-left bg-white/5 rounded-lg p-3 max-h-60 overflow-y-auto">
                <div className="text-white/70 mb-2 font-semibold">
                  Batch Details ({result.totalBatches} batches completed):
                </div>
                <div className="space-y-1 text-xs">
                  {result.batchResults.map((batch) => (
                    <div key={batch.batchNumber} className="flex items-center justify-between text-white/60">
                      <span>Batch {batch.batchNumber}/{result.totalBatches}:</span>
                      <span className={batch.failedCount > 0 ? 'text-yellow-400' : 'text-green-400'}>
                        {batch.successCount} sent {batch.failedCount > 0 && `(${batch.failedCount} failed)`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Retry Failed Button */}
            {result.success && result.failedTokensCount && result.failedTokensCount > 0 && lastSendData && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <button
                  onClick={async () => {
                    if (!lastSendData?.logId) return
                    setIsSending(true)
                    setResult(null)
                    setSendingProgress({
                      isSending: true,
                      totalBatches: Math.ceil((result.failedTokensCount || 0) / 500),
                      message: `Retrying ${result.failedTokensCount} failed notifications...`,
                    })
                    try {
                      const response = await fetch('/api/retry-failed-notifications', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          logId: lastSendData.logId,
                          title: lastSendData.title,
                          body: lastSendData.body,
                        }),
                      })
                      const data = await response.json().catch(() => ({}))
                      if (response.ok && data.success) {
                        setResult({
                          success: true,
                          message: data.message,
                          subscriberCount: data.subscriberCount,
                          totalBatches: data.totalBatches,
                          batchResults: data.batchResults,
                          failedTokensCount: data.failedTokensCount,
                          logId: data.logId,
                        })
                        fetchSubscriberCount()
                        fetchStats()
                      } else {
                        setResult({
                          success: false,
                          message: data.message || 'Retry failed',
                        })
                      }
                    } catch (error) {
                      setResult({
                        success: false,
                        message: 'Retry request failed',
                      })
                    } finally {
                      setIsSending(false)
                      setSendingProgress(null)
                    }
                  }}
                  disabled={isSending}
                  className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Retry {result.failedTokensCount} Failed Notifications
                </button>
              </div>
            )}
          </div>
        )}
        <p className="text-white/50 text-xs text-center">First send after opening this page may take 10–15 seconds.</p>
      </div>
    </main>
  )
}
