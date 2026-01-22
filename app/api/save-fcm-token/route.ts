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

    // Save token to Firestore using batch write (more efficient, stays under rate limits)
    // Firestore batch writes are more efficient and handle rate limiting better
    // Even for single writes, using batch API is recommended for high concurrency
    let retries = 0
    const maxRetries = 5
    let lastError: Error | null = null

    while (retries < maxRetries) {
      try {
        // Use batch write (even for single operation) - more efficient under load
        const batch = db.batch()
        const docRef = collection.doc(docId)
        const now = new Date()
        
        batch.set(docRef, {
          token,
          createdAt: now,
          updatedAt: now,
        }, { merge: false })
        
        await batch.commit()
        lastError = null
        break // Success, exit retry loop
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        // Check if it's a quota/resource exhaustion error (retry these)
        const errorMessage = lastError.message.toLowerCase()
        const isQuotaError = 
          errorMessage.includes('quota') ||
          errorMessage.includes('resource') ||
          errorMessage.includes('exhausted') ||
          errorMessage.includes('rate limit') ||
          errorMessage.includes('429') ||
          errorMessage.includes('too many')

        if (isQuotaError && retries < maxRetries - 1) {
          // Exponential backoff: 1s, 2s, 4s, 8s, 16s
          const delay = Math.min(1000 * Math.pow(2, retries), 10000)
          console.warn(`Token save quota error (attempt ${retries + 1}/${maxRetries}), retrying in ${delay}ms...`)
          await new Promise((r) => setTimeout(r, delay))
          retries++
          continue
        } else {
          // Not a quota error, or max retries reached - throw immediately
          throw error
        }
      }
    }

    // If we exhausted retries, throw the last error
    if (lastError) {
      throw lastError
    }

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

    // Subscribe token to FCM topic (for free tier compliance - zero reads when sending)
    // This allows sending to all subscribers without reading tokens from Firestore
    try {
      const messaging = getMessaging(domain)
      await messaging.subscribeToTopic([token], config.topicName)
      console.log('Token subscribed to topic:', config.topicName)
    } catch (topicError) {
      console.error('Error subscribing to topic (non-critical):', topicError)
      // Continue even if topic subscription fails - token is still saved
    }

    // Token is saved and subscribed to topic - ready for immediate push notifications
    console.log('Token saved successfully for domain:', domain, 'docId:', docId, 'topic:', config.topicName)

    return NextResponse.json({
      success: true,
      message: 'Token saved successfully',
    })
  } catch (error) {
    console.error('Error saving FCM token:', error)
    
    // Check if it's a quota error (user-friendly message)
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : ''
    const isQuotaError = 
      errorMessage.includes('quota') ||
      errorMessage.includes('resource') ||
      errorMessage.includes('exhausted') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('429')

    // Return user-friendly error (not technical)
    if (isQuotaError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Server is busy. Please try again in a moment.',
        },
        { status: 503 } // Service Unavailable
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to save token. Please try again.',
      },
      { status: 500 }
    )
  }
}
