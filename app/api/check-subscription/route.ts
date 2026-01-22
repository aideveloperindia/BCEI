import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebase-admin'
import { getClientConfig } from '@/config/client-firebase-map'
import { createHash } from 'crypto'

export const dynamic = 'force-dynamic'

/**
 * Check if a token is already subscribed (exists in Firestore)
 * Used to verify subscription status on page load
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
    const { token } = body

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, isSubscribed: false },
        { status: 400 }
      )
    }

    // Hash token to get doc ID (same as save-fcm-token)
    const docId = createHash('sha256').update(token).digest('hex')

    const db = getFirestore(domain)
    const collection = db.collection(config.collectionName)
    const doc = await collection.doc(docId).get()

    return NextResponse.json({
      success: true,
      isSubscribed: doc.exists && doc.data()?.token === token,
    })
  } catch (error) {
    console.error('Error checking subscription:', error)
    return NextResponse.json(
      {
        success: false,
        isSubscribed: false,
      },
      { status: 500 }
    )
  }
}
