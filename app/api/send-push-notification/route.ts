import { NextRequest, NextResponse } from 'next/server'
import { getMessaging, getFirestore } from '@/lib/firebase-admin'
import { getClientConfig } from '@/config/client-firebase-map'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const host = request.headers.get('host') || ''
    const domain = host.split(':')[0]
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const baseUrl = `${protocol}://${domain}`

    const config = getClientConfig(domain)
    if (!config) {
      return NextResponse.json(
        { success: false, message: `No config found for domain: ${domain}` },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { title, body: messageBody } = body

    if (!title || !messageBody) {
      return NextResponse.json(
        { success: false, message: 'Title and body are required' },
        { status: 400 }
      )
    }

    const messaging = getMessaging(domain)
    const db = getFirestore(domain)
    const tokensRef = db.collection(config.collectionName)

    // Get all FCM tokens from Firestore (send to each token directly; more reliable than topic for web)
    // Admin SDK always reads from server (fresh data) - critical for immediate testing after subscription
    const snapshot = await tokensRef.get()
    const tokens: string[] = []
    const docIds: string[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      const t = data.token
      if (t && typeof t === 'string' && t.trim().length > 0) {
        tokens.push(t)
        docIds.push(doc.id)
      } else {
        console.warn('Skipping invalid token in doc:', doc.id, 'token type:', typeof t)
      }
    })

    console.log(`Found ${tokens.length} valid tokens out of ${snapshot.size} total docs for domain: ${domain}`)

    const subscriberCount = tokens.length
    if (subscriberCount === 0) {
      await db.collection('notification_logs').add({
        title,
        body: messageBody,
        subscriberCount: 0,
        success: false,
        error: 'No tokens to send to',
        sentAt: new Date(),
        domain,
      })
      return NextResponse.json({
        success: false,
        message: 'No subscribers. Ask users to allow notifications on the site first.',
      })
    }

    const message = {
      tokens,
      notification: { title, body: messageBody },
      webpush: {
        headers: { Urgency: 'high' },
        notification: {
          title,
          body: messageBody,
          icon: `${baseUrl}/advocates-logo.png`,
          tag: 'bar-council-notification',
          requireInteraction: false,
        },
        fcmOptions: {
          link: baseUrl,
        },
      },
    }

    let successCount = 0
    let errorMessage: string | null = null

    try {
      const batch = await messaging.sendEachForMulticast(message)
      successCount = batch.successCount

      // Remove invalid/unregistered tokens from Firestore
      const toRemove: string[] = []
      batch.responses.forEach((r, i) => {
        if (!r.success && r.error?.code === 'messaging/invalid-registration-token') toRemove.push(docIds[i])
        if (!r.success && r.error?.code === 'messaging/registration-token-not-registered') toRemove.push(docIds[i])
      })
      if (toRemove.length > 0) {
        await Promise.all(toRemove.map((id) => tokensRef.doc(id).delete()))
      }

      if (batch.failureCount > 0 && successCount === 0) {
        errorMessage = batch.responses.find((r) => !r.success)?.error?.message ?? 'All sends failed'
      }
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Unknown error'
    }

    const success = successCount > 0

    await db.collection('notification_logs').add({
      title,
      body: messageBody,
      subscriberCount,
      success,
      successCount,
      failedCount: subscriberCount - successCount,
      error: errorMessage,
      sentAt: new Date(),
      domain,
    })

    if (success) {
      return NextResponse.json({
        success: true,
        subscriberCount,
        successCount,
        message: `Notification sent to ${successCount} of ${subscriberCount} subscribers`,
      })
    }

    return NextResponse.json(
      {
        success: false,
        message: errorMessage || `Failed to deliver to all ${subscriberCount} subscribers`,
      },
      { status: 500 }
    )
  } catch (error) {
    console.error('Error sending push notification:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to send notification',
      },
      { status: 500 }
    )
  }
}
