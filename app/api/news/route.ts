import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebase-admin'
import { getClientConfig } from '@/config/client-firebase-map'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
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

    const db = getFirestore(domain)
    const newsRef = db.collection('news')

    const snapshot = await newsRef
      .where('domain', '==', domain)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get()

    const news = snapshot.docs.map((doc) => {
      const d = doc.data()
      return {
        id: doc.id,
        title: d.title,
        body: d.body,
        createdAt: d.createdAt?.toDate?.()?.toISOString() ?? d.createdAt,
      }
    })

    return NextResponse.json({ success: true, news })
  } catch (error) {
    console.error('Error getting news:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to get news' },
      { status: 500 }
    )
  }
}

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
    const { title, body: newsBody } = body

    if (!title || !newsBody) {
      return NextResponse.json(
        { success: false, message: 'Title and body are required' },
        { status: 400 }
      )
    }

    const db = getFirestore(domain)
    const newsRef = db.collection('news')

    await newsRef.add({
      title,
      body: newsBody,
      domain,
      createdAt: new Date(),
    })

    return NextResponse.json({ success: true, message: 'News saved successfully' })
  } catch (error) {
    console.error('Error saving news:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to save news' },
      { status: 500 }
    )
  }
}
