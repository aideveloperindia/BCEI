import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebase-admin'
import { getClientConfig } from '@/config/client-firebase-map'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 1 minute max

/**
 * Batch save FCM tokens to Firestore
 * Processes tokens in batches of 500 (Firestore batch limit) to stay under rate limits
 * This prevents quota errors when 35,000 users subscribe simultaneously
 */
export async function POST(request: NextRequest) {
  try {
    const host = request.headers.get('host') || ''
    const domain = host.split(':')[0]

    const config = getClientConfig(domain)
    if (!config) {
      return NextResponse.json(
        { success: false, message: `No config found for domain: ${domain}` },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { tokens } = body // Array of tokens to save

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Tokens array is required' },
        { status: 400 }
      )
    }

    // Validate all tokens
    const validTokens = tokens.filter((t: any) => t && typeof t === 'string' && t.trim().length > 0)
    if (validTokens.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid tokens provided' },
        { status: 400 }
      )
    }

    const db = getFirestore(domain)
    const collection = db.collection(config.collectionName)

    // Firestore batch limit is 500 operations per batch
    const BATCH_SIZE = 500
    const batches: string[][] = []
    
    // Split tokens into batches of 500
    for (let i = 0; i < validTokens.length; i += BATCH_SIZE) {
      batches.push(validTokens.slice(i, i + BATCH_SIZE))
    }

    const results = {
      total: validTokens.length,
      saved: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Process each batch sequentially (stays under rate limits)
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batchTokens = batches[batchIndex]
      const batch = db.batch()
      const now = new Date()

      // Add all writes to this batch
      batchTokens.forEach((token: string) => {
        const docId = createHash('sha256').update(token).digest('hex')
        const docRef = collection.doc(docId)
        batch.set(docRef, {
          token,
          createdAt: now,
          updatedAt: now,
        }, { merge: false })
      })

      // Commit batch with retry logic
      let retries = 0
      const maxRetries = 3
      let batchSuccess = false

      while (retries < maxRetries && !batchSuccess) {
        try {
          await batch.commit()
          results.saved += batchTokens.length
          batchSuccess = true
          console.log(`Batch ${batchIndex + 1}/${batches.length}: Saved ${batchTokens.length} tokens`)
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message.toLowerCase() : ''
          const isQuotaError = 
            errorMessage.includes('quota') ||
            errorMessage.includes('resource') ||
            errorMessage.includes('exhausted') ||
            errorMessage.includes('rate limit') ||
            errorMessage.includes('429')

          if (isQuotaError && retries < maxRetries - 1) {
            // Exponential backoff: 2s, 4s, 8s
            const delay = 2000 * Math.pow(2, retries)
            console.warn(`Batch ${batchIndex + 1} quota error, retrying in ${delay}ms...`)
            await new Promise((r) => setTimeout(r, delay))
            retries++
          } else {
            // Not retryable or max retries reached
            results.failed += batchTokens.length
            results.errors.push(`Batch ${batchIndex + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
            console.error(`Batch ${batchIndex + 1} failed:`, error)
            break
          }
        }
      }

      // Small delay between batches to stay under rate limits (50 writes/second = 20ms between batches)
      // But we're doing 500 at once, so wait 100ms between batches to be safe
      if (batchIndex < batches.length - 1) {
        await new Promise((r) => setTimeout(r, 100))
      }
    }

    return NextResponse.json({
      success: results.failed === 0,
      total: results.total,
      saved: results.saved,
      failed: results.failed,
      batches: batches.length,
      errors: results.errors.length > 0 ? results.errors : undefined,
      message: `Saved ${results.saved} of ${results.total} tokens in ${batches.length} batches`,
    })
  } catch (error) {
    console.error('Error in batch save tokens:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to batch save tokens',
      },
      { status: 500 }
    )
  }
}
