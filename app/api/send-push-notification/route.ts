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

    // Get all FCM tokens from Firestore (send to each token directly; more reliable than topic for web)
    // Admin SDK always reads from server (fresh data) - critical for immediate testing after subscription
    const snapshot = await tokensRef.get()
    const tokens: string[] = []
    const docIds: string[] = []
    
    snapshot.forEach((doc) => {
      const data = doc.data()
      const t = data.token
      // Use centralized validation (same as get-subscriber-count)
      if (isValidToken(t)) {
        tokens.push(t)
        docIds.push(doc.id)
      } else {
        console.warn(`send-push: Skipping invalid token in doc ${doc.id} - ${getTokenValidationReason(t)}`)
      }
    })

    console.log(`send-push-notification: Found ${tokens.length} valid tokens out of ${snapshot.size} total docs for domain: ${domain}, collection: ${config.collectionName}`)
    console.log(`send-push-notification: Doc IDs with valid tokens: ${docIds.join(', ')}`)
    
    // Always log ALL docs (valid and invalid) for debugging
    const invalidDocs: Array<{ id: string; reason: string }> = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      const t = data.token
      if (!isValidToken(t)) {
        const reason = getTokenValidationReason(t)
        invalidDocs.push({ id: doc.id, reason })
        console.warn(`send-push: Doc ${doc.id}: INVALID - ${reason}`)
      } else {
        console.log(`send-push: Doc ${doc.id}: VALID - token length: ${t.length}`)
      }
    })
    
    // Automatically clean up invalid documents (prevents count mismatches)
    if (invalidDocs.length > 0) {
      console.error(`send-push: Found ${invalidDocs.length} invalid docs that will be cleaned up:`, invalidDocs)
      // Delete invalid docs immediately to keep database clean
      await Promise.all(invalidDocs.map((doc) => tokensRef.doc(doc.id).delete()))
      console.log(`send-push: Cleaned up ${invalidDocs.length} invalid token documents`)
    }
    
    // If count mismatch, log error (shouldn't happen after cleanup)
    if (snapshot.size !== tokens.length + invalidDocs.length) {
      console.error(`CRITICAL: Token count mismatch! ${snapshot.size} docs but only ${tokens.length} valid tokens (${invalidDocs.length} invalid)`)
    }

    const subscriberCount = tokens.length
    
    // CRITICAL: Verify count matches get-subscriber-count API
    // Read count using same logic to compare
    const countSnapshot = await tokensRef.get()
    let countApiCount = 0
    countSnapshot.forEach((doc) => {
      const data = doc.data()
      const t = data.token
      if (isValidToken(t)) {
        countApiCount++
      }
    })
    
    if (countApiCount !== subscriberCount) {
      console.error(`CRITICAL MISMATCH: send-push found ${subscriberCount} tokens but count API logic would find ${countApiCount}`)
      console.error(`  send-push snapshot size: ${snapshot.size}, tokens: ${tokens.length}`)
      console.error(`  count API snapshot size: ${countSnapshot.size}, count: ${countApiCount}`)
    }
    
    // Log BEFORE sending to see what we're about to send
    console.log(`send-push-notification: About to send to ${subscriberCount} subscribers (${tokens.length} tokens), count API would show: ${countApiCount}`)
    
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

    // FCM sendEachForMulticast can only handle 500 tokens at a time
    // For 35,000+ subscribers, we need to batch the sends
    const BATCH_SIZE = 500
    let successCount = 0
    let totalFailed = 0
    let errorMessage: string | null = null
    const toRemove: string[] = []

    try {
      // Process tokens in batches of 500
      for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
        const batchTokens = tokens.slice(i, i + BATCH_SIZE)
        const batchDocIds = docIds.slice(i, i + BATCH_SIZE)

        const message = {
          tokens: batchTokens,
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

        const batch = await messaging.sendEachForMulticast(message)
        successCount += batch.successCount
        totalFailed += batch.failureCount

        // Track invalid/unregistered tokens for removal
        batch.responses.forEach((r, j) => {
          if (!r.success && r.error?.code === 'messaging/invalid-registration-token') {
            toRemove.push(batchDocIds[j])
            console.log(`send-push: Removing invalid token doc: ${batchDocIds[j]}`)
          }
          if (!r.success && r.error?.code === 'messaging/registration-token-not-registered') {
            toRemove.push(batchDocIds[j])
            console.log(`send-push: Removing unregistered token doc: ${batchDocIds[j]}`)
          }
        })

        console.log(`send-push: Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(tokens.length / BATCH_SIZE)}: ${batch.successCount} sent, ${batch.failureCount} failed`)
      }

      // Remove all invalid/unregistered tokens after all batches complete
      if (toRemove.length > 0) {
        console.log(`send-push: Deleting ${toRemove.length} invalid/unregistered tokens`)
        await Promise.all(toRemove.map((id) => tokensRef.doc(id).delete()))
        console.log(`send-push: Deleted ${toRemove.length} tokens. Remaining subscribers: ${subscriberCount - toRemove.length}`)
      }

      if (totalFailed > 0 && successCount === 0) {
        errorMessage = 'All sends failed across all batches'
      } else if (totalFailed > 0) {
        errorMessage = `${totalFailed} sends failed (${successCount} succeeded)`
      }
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('send-push: Error during batch sending:', err)
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
