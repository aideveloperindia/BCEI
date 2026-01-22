import { NextRequest, NextResponse } from 'next/server'
import { getMessaging, getFirestore } from '@/lib/firebase-admin'
import { getClientConfig } from '@/config/client-firebase-map'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes max

/**
 * Retry sending notifications to failed tokens from a previous send
 * This allows admin to retry only the failed batches without resending to successful ones
 */
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
    const { logId, failedTokens } = body

    if (!logId && !failedTokens) {
      return NextResponse.json(
        { success: false, message: 'Either logId or failedTokens array is required' },
        { status: 400 }
      )
    }

    const messaging = getMessaging(domain)
    const db = getFirestore(domain)

    let tokensToRetry: string[] = []

    // If logId provided, fetch failed tokens from that log
    if (logId) {
      const logDoc = await db.collection('notification_logs').doc(logId).get()
      if (!logDoc.exists) {
        return NextResponse.json(
          { success: false, message: 'Notification log not found' },
          { status: 404 }
        )
      }

      const logData = logDoc.data()
      if (!logData?.failedTokens || logData.failedTokens.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'No failed tokens found in this notification log',
        })
      }

      tokensToRetry = logData.failedTokens
    } else if (failedTokens && Array.isArray(failedTokens)) {
      tokensToRetry = failedTokens
    }

    if (tokensToRetry.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No tokens to retry',
      })
    }

    const { title, body: messageBody } = body
    if (!title || !messageBody) {
      return NextResponse.json(
        { success: false, message: 'Title and body are required' },
        { status: 400 }
      )
    }

    // Batch tokens (500 per batch)
    const BATCH_SIZE = 500
    const totalBatches = Math.ceil(tokensToRetry.length / BATCH_SIZE)
    let successCount = 0
    let totalFailed = 0
    const batchResults: Array<{ batchNumber: number; successCount: number; failedCount: number }> = []
    const toRemove: string[] = []

    try {
      for (let i = 0; i < tokensToRetry.length; i += BATCH_SIZE) {
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1
        const batchTokens = tokensToRetry.slice(i, i + BATCH_SIZE)

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
        const batchSuccess = batch.successCount
        const batchFailed = batch.failureCount
        successCount += batchSuccess
        totalFailed += batchFailed

        batchResults.push({
          batchNumber,
          successCount: batchSuccess,
          failedCount: batchFailed,
        })

        // Remove invalid/unregistered tokens
        batch.responses.forEach((r, j) => {
          if (!r.success && (r.error?.code === 'messaging/invalid-registration-token' || r.error?.code === 'messaging/registration-token-not-registered')) {
            toRemove.push(batchTokens[j]) // Note: This is the token, not doc ID (we'd need doc IDs for full cleanup)
            console.log(`retry-failed: Token ${batchTokens[j].substring(0, 20)}... is invalid/unregistered`)
          }
        })

        console.log(`retry-failed: Batch ${batchNumber}/${totalBatches}: ${batchSuccess} sent, ${batchFailed} failed`)
      }

      if (toRemove.length > 0) {
        console.log(`retry-failed: ${toRemove.length} tokens are invalid/unregistered (should be removed from Firestore)`)
      }
    } catch (err) {
      console.error('retry-failed: Error during batch sending:', err)
      return NextResponse.json(
        {
          success: false,
          message: err instanceof Error ? err.message : 'Failed to retry notifications',
        },
        { status: 500 }
      )
    }

    const success = successCount > 0

    // Log retry attempt
    await db.collection('notification_logs').add({
      title: `[RETRY] ${title}`,
      body: messageBody,
      subscriberCount: tokensToRetry.length,
      success,
      successCount,
      failedCount: totalFailed,
      sentAt: new Date(),
      domain,
      totalBatches,
      batchResults,
      isRetry: true,
      originalLogId: logId,
    })

    if (success) {
      return NextResponse.json({
        success: true,
        subscriberCount: tokensToRetry.length,
        successCount,
        totalBatches,
        batchResults,
        message: `Retry: Sent to ${successCount} of ${tokensToRetry.length} failed subscribers across ${totalBatches} batches`,
      })
    }

    return NextResponse.json(
      {
        success: false,
        message: `Retry failed: Could not deliver to any of ${tokensToRetry.length} subscribers`,
      },
      { status: 500 }
    )
  } catch (error) {
    console.error('Error retrying failed notifications:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retry notifications',
      },
      { status: 500 }
    )
  }
}
