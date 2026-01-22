import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebase-admin'
import { getClientConfig } from '@/config/client-firebase-map'

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
    snapshot.forEach((doc) => {
      const data = doc.data()
      const t = data.token
      // Only count if token exists, is a string, and is not empty (match send-push validation)
      if (t && typeof t === 'string' && t.trim().length > 0) {
        count++
      } else {
        console.warn('get-subscriber-count: Skipping invalid token in doc:', doc.id, 'token type:', typeof t, 'has token:', !!t)
      }
    })
    
    console.log(`get-subscriber-count: Found ${count} valid tokens out of ${snapshot.size} total docs for domain: ${domain}`)

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
