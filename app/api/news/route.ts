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

    // Get all news for domain (without orderBy to avoid index requirement)
    // Then sort in memory by createdAt
    const allSnapshot = await newsRef
      .where('domain', '==', domain)
      .get()

    // Convert to array and sort by createdAt (newest first)
    const allNews = allSnapshot.docs.map((doc) => {
      const d = doc.data()
      const createdAt = d.createdAt?.toDate?.() ?? d.createdAt
      return {
        id: doc.id,
        title: d.title,
        body: d.body,
        createdAt: createdAt instanceof Date ? createdAt.toISOString() : (typeof createdAt === 'string' ? createdAt : new Date().toISOString()),
        createdAtRaw: createdAt,
      }
    })

    // Sort by createdAt descending (newest first)
    allNews.sort((a, b) => {
      const aTime = a.createdAtRaw instanceof Date ? a.createdAtRaw.getTime() : (new Date(a.createdAt).getTime() || 0)
      const bTime = b.createdAtRaw instanceof Date ? b.createdAtRaw.getTime() : (new Date(b.createdAt).getTime() || 0)
      return bTime - aTime
    })

    // Take latest 50
    const news = allNews.slice(0, 50).map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      createdAt: item.createdAt,
    }))

    console.log(`News API: Found ${news.length} news items for domain: ${domain}`)
    if (news.length === 0) {
      console.log('No news found - checking if collection exists and has documents')
    }

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
