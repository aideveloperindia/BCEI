import { createHash } from 'crypto'
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

    // Safe doc ID (tokens can contain /, +, = which are invalid in Firestore doc IDs)
    const docId = createHash('sha256').update(token).digest('hex')

    // Get Firestore instance
    const db = getFirestore(domain)
    const collection = db.collection(config.collectionName)

    // Save token to Firestore (use hashed doc ID to avoid invalid chars, prevent duplicates by token)
    // Use set() with merge: false to ensure immediate write (not just update)
    await collection.doc(docId).set(
      {
        token,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { merge: false }
    )

    // Verify token was saved and is readable immediately (critical for immediate push testing)
    let savedDoc = await collection.doc(docId).get()
    if (!savedDoc.exists) {
      // Retry verification once (Firestore eventual consistency edge case)
      await new Promise((r) => setTimeout(r, 100))
      savedDoc = await collection.doc(docId).get()
      if (!savedDoc.exists) {
        console.error('Token save verification failed for docId:', docId)
        return NextResponse.json(
          { success: false, message: 'Failed to save token' },
          { status: 500 }
        )
      }
    }

    // Double-check token matches
    const savedToken = savedDoc.data()?.token
    if (savedToken !== token) {
      console.error('Token mismatch after save. Expected:', token, 'Got:', savedToken)
      return NextResponse.json(
        { success: false, message: 'Token verification failed' },
        { status: 500 }
      )
    }

    // Subscribe token to FCM topic (optional, we send per-token anyway)
    try {
      const messaging = getMessaging(domain)
      await messaging.subscribeToTopic([token], config.topicName)
    } catch (topicError) {
      console.error('Error subscribing to topic:', topicError)
      // Continue even if topic subscription fails - we send per-token anyway
    }

    console.log('Token saved successfully for domain:', domain, 'docId:', docId)

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
