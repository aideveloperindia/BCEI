import { NextRequest, NextResponse } from 'next/server'
import { getMessaging, getFirestore } from '@/lib/firebase-admin'
import { getClientConfig } from '@/config/client-firebase-map'

export async function POST(request: NextRequest) {
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

    // Get request body
    const body = await request.json()
    const { title, body: messageBody, clientId } = body

    if (!title || !messageBody) {
      return NextResponse.json(
        { success: false, message: 'Title and body are required' },
        { status: 400 }
      )
    }

    // Use clientId if provided, otherwise use domain-based topic
    const topicName = clientId ? `${clientId}_notifications` : config.topicName

    // Get messaging instance
    const messaging = getMessaging(domain)
    const db = getFirestore(domain)

    // Get subscriber count before sending
    const subscriberCountSnapshot = await db.collection(config.collectionName).count().get()
    const subscriberCount = subscriberCountSnapshot.data().count

    // Send notification to topic
    const message = {
      topic: topicName,
      notification: {
        title,
        body: messageBody,
      },
      webpush: {
        notification: {
          title,
          body: messageBody,
        },
        fcmOptions: {
          link: '/',
        },
      },
    }

    let messageId: string | null = null
    let success = false
    let errorMessage: string | null = null

    try {
      const response = await messaging.send(message)
      messageId = response
      success = true
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unknown error'
      success = false
    }

    // Log notification to Firestore for analytics
    const notificationLog = {
      title,
      body: messageBody,
      topic: topicName,
      subscriberCount,
      success,
      messageId,
      error: errorMessage,
      sentAt: new Date(),
      domain,
    }

    await db.collection('notification_logs').add(notificationLog)

    if (success) {
      return NextResponse.json({
        success: true,
        messageId,
        subscriberCount,
        message: `Notification sent successfully to ${subscriberCount} subscribers`,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: errorMessage || 'Failed to send notification',
        },
        { status: 500 }
      )
    }
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
