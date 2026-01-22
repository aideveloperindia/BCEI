import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebase-admin'
import { getClientConfig } from '@/config/client-firebase-map'
import { isValidToken, getTokenValidationReason } from '@/lib/token-validation'

export const dynamic = 'force-dynamic'

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
    const collection = db.collection(config.collectionName)

    // Read all documents and count (more reliable than count query)
    // Admin SDK always reads fresh from server - ensures immediate count after subscription
    const snapshot = await collection.get()
    let count = 0
    const invalidDocs: Array<{ id: string; reason: string }> = []
    
    snapshot.forEach((doc) => {
      const data = doc.data()
      const t = data.token
      // Use centralized validation (same as send-push)
      if (isValidToken(t)) {
        count++
      } else {
        const reason = getTokenValidationReason(t)
        invalidDocs.push({ id: doc.id, reason })
        console.warn(`get-subscriber-count: Skipping invalid token in doc ${doc.id} - ${reason}`)
      }
    })
    
    console.log(`get-subscriber-count: Found ${count} valid tokens out of ${snapshot.size} total docs for domain: ${domain}, collection: ${config.collectionName}`)
    
    // Log all doc IDs for debugging
    const allDocIds: string[] = []
    snapshot.forEach((doc) => {
      allDocIds.push(doc.id)
    })
    console.log(`get-subscriber-count: All Doc IDs: ${allDocIds.join(', ')}`)
    
    if (invalidDocs.length > 0) {
      console.error(`get-subscriber-count: Found ${invalidDocs.length} invalid docs (these should be cleaned up):`, invalidDocs)
    }

    return NextResponse.json({
      success: true,
      count,
    })
  } catch (error) {
    console.error('Error getting subscriber count:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get count',
        count: 0,
      },
      { status: 500 }
    )
  }
}
