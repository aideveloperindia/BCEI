import { NextRequest, NextResponse } from 'next/server'
import { getFirestore, getMessaging } from '@/lib/firebase-admin'
import { getClientConfig } from '@/config/client-firebase-map'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Get domain from request headers
    const host = request.headers.get('host') || ''
    const domain = host.split(':')[0] // Remove port if present

    // Get client config
    const config = getClientConfig(domain)
    if (!config) {
      return NextResponse.json(
        { success: false, message: `No config found for domain: ${domain}` },
        { status: 400 }
      )
    }

    // Get FCM token from request body
    const body = await request.json()
    const { token } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, message: 'FCM token is required' },
        { status: 400 }
      )
    }

    // Get Firestore instance
    const db = getFirestore(domain)
    const collection = db.collection(config.collectionName)

    // Save token to Firestore (use token as document ID to prevent duplicates)
    await collection.doc(token).set(
      {
        token,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { merge: true }
    )

    // Subscribe token to FCM topic
    try {
      const messaging = getMessaging(domain)
      await messaging.subscribeToTopic([token], config.topicName)
    } catch (topicError) {
      console.error('Error subscribing to topic:', topicError)
      // Continue even if topic subscription fails
    }

    return NextResponse.json({
      success: true,
      message: 'Token saved successfully',
    })
  } catch (error) {
    console.error('Error saving FCM token:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save token',
      },
      { status: 500 }
    )
  }
}
