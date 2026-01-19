import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebase-admin'
import { getClientConfig } from '@/config/client-firebase-map'

export async function GET(request: NextRequest) {
  try {
    // Get domain from request headers
    const host = request.headers.get('host') || ''
    const domain = host.split(':')[0]

    // Get client config
    const config = getClientConfig(domain)
    if (!config) {
      return NextResponse.json(
        { success: false, message: `No config found for domain: ${domain}` },
        { status: 400 }
      )
    }

    // Get Firestore instance
    const db = getFirestore(domain)
    const logsCollection = db.collection('notification_logs')

    // Get all notification logs
    const logsSnapshot = await logsCollection
      .orderBy('sentAt', 'desc')
      .limit(100) // Get last 100 notifications
      .get()

    const logs = logsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      sentAt: doc.data().sentAt?.toDate?.() || doc.data().sentAt,
    }))

    // Calculate statistics
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const totalSent = logs.length
    const sentToday = logs.filter(
      (log) => new Date(log.sentAt) >= today
    ).length
    const sentThisWeek = logs.filter(
      (log) => new Date(log.sentAt) >= thisWeek
    ).length
    const sentThisMonth = logs.filter(
      (log) => new Date(log.sentAt) >= thisMonth
    ).length

    const successful = logs.filter((log) => log.success === true).length
    const failed = logs.filter((log) => log.success === false).length
    const successRate =
      totalSent > 0 ? ((successful / totalSent) * 100).toFixed(1) : '0'

    // Calculate total subscribers reached
    const totalSubscribersReached = logs.reduce(
      (sum, log) => sum + (log.subscriberCount || 0),
      0
    )

    return NextResponse.json({
      success: true,
      stats: {
        totalSent,
        sentToday,
        sentThisWeek,
        sentThisMonth,
        successful,
        failed,
        successRate: `${successRate}%`,
        totalSubscribersReached,
      },
      recentLogs: logs.slice(0, 10), // Last 10 notifications
    })
  } catch (error) {
    console.error('Error getting notification stats:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get stats',
        stats: {
          totalSent: 0,
          sentToday: 0,
          sentThisWeek: 0,
          sentThisMonth: 0,
          successful: 0,
          failed: 0,
          successRate: '0%',
          totalSubscribersReached: 0,
        },
        recentLogs: [],
      },
      { status: 500 }
    )
  }
}
