import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebase-admin'
import { getClientConfig } from '@/config/client-firebase-map'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params
    const db = getFirestore(domain)
    const newsDoc = await db.collection('news').doc(id).get()

    if (!newsDoc.exists) {
      return NextResponse.json(
        { success: false, message: 'News not found' },
        { status: 404 }
      )
    }

    const d = newsDoc.data()
    if (d?.domain !== domain) {
      return NextResponse.json(
        { success: false, message: 'News not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      news: {
        id: newsDoc.id,
        title: d.title,
        body: d.body,
        createdAt: d.createdAt?.toDate?.()?.toISOString() ?? d.createdAt,
      },
    })
  } catch (error) {
    console.error('Error getting news:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to get news' },
      { status: 500 }
    )
  }
}
