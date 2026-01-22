import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebase-admin'
import { getClientConfig } from '@/config/client-firebase-map'

export const dynamic = 'force-dynamic'

/** Cleanup invalid token documents (ones without valid token field) */
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

    // Check for admin password (simple protection)
    const body = await request.json().catch(() => ({}))
    const { password } = body
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
    if (password !== adminPassword) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const db = getFirestore(domain)
    const collection = db.collection(config.collectionName)
    const snapshot = await collection.get()

    const toDelete: string[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      const t = data.token
      // Same validation as count and send-push
      if (!t || typeof t !== 'string' || t.trim().length === 0) {
        toDelete.push(doc.id)
      }
    })

    if (toDelete.length > 0) {
      await Promise.all(toDelete.map((id) => collection.doc(id).delete()))
      return NextResponse.json({
        success: true,
        message: `Deleted ${toDelete.length} invalid token documents`,
        deleted: toDelete,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'No invalid tokens found',
      deleted: [],
    })
  } catch (error) {
    console.error('Error cleaning up invalid tokens:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to cleanup',
      },
      { status: 500 }
    )
  }
}
