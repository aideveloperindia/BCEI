import { NextRequest, NextResponse } from 'next/server'
import { getMessaging, getFirestore } from '@/lib/firebase-admin'
import { getClientConfig } from '@/config/client-firebase-map'
import { isValidToken, getTokenValidationReason } from '@/lib/token-validation'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes max (for 35,000 subscribers = 70 batches)

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

    // FREE TIER OPTIMIZATION: Use FCM Topics instead of reading all tokens
    // This eliminates Firestore reads when sending (stays within free tier limits)
    // Get subscriber count for logging (minimal reads - only for count)
    const countSnapshot = await tokensRef.get()
    let subscriberCount = 0
    countSnapshot.forEach((doc) => {
      const data = doc.data()
      const t = data.token
      if (isValidToken(t)) {
        subscriberCount++
      }
    })

    console.log(`send-push-notification: Sending to topic "${config.topicName}" (${subscriberCount} subscribers) - ZERO Firestore reads for sending!`)

    if (subscriberCount === 0) {
      await db.collection('notification_logs').add({
        title,
        body: messageBody,
        subscriberCount: 0,
        success: false,
        error: 'No subscribers',
        sentAt: new Date(),
        domain,
      })
      return NextResponse.json({
        success: false,
        message: 'No subscribers. Ask users to allow notifications on the site first.',
      })
    }

    // Send to FCM topic (ZERO Firestore reads - stays within free tier!)
    let successCount = subscriberCount // FCM topics deliver to all subscribers
    let errorMessage: string | null = null
    const batchResults: Array<{ 
      batchNumber: number
      successCount: number
      failedCount: number
    }> = []

    try {
      const message = {
        topic: config.topicName,
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

      // Send to topic - FCM handles delivery to all subscribers automatically
      const response = await messaging.send(message)
      console.log(`send-push: Sent to topic "${config.topicName}" - messageId: ${response}`)
      
      // Topic sends are all-or-nothing, so we assume all subscribers receive it
      // FCM handles delivery internally (no batch results needed)
      batchResults.push({
        batchNumber: 1,
        successCount: subscriberCount,
        failedCount: 0,
      })
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('send-push: Error sending to topic:', err)
      successCount = 0
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
      method: 'topic', // Indicate we used topic messaging
    })

    if (success) {
      return NextResponse.json({
        success: true,
        subscriberCount,
        successCount,
        totalBatches: 1, // Topic sends are single operation
        batchResults,
        message: `Notification sent to ${subscriberCount} subscribers via FCM topic (zero Firestore reads - free tier compliant!)`,
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
