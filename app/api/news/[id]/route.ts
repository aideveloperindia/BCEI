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

export async function PUT(
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
    const body = await request.json()
    const { title, body: newsBody } = body

    if (!title || !newsBody) {
      return NextResponse.json(
        { success: false, message: 'Title and body are required' },
        { status: 400 }
      )
    }

    const db = getFirestore(domain)
    const newsRef = db.collection('news').doc(id)
    
    // Check if news exists and belongs to this domain
    const newsDoc = await newsRef.get()
    if (!newsDoc.exists) {
      return NextResponse.json(
        { success: false, message: 'News not found' },
        { status: 404 }
      )
    }

    const existingData = newsDoc.data()
    if (existingData?.domain !== domain) {
      return NextResponse.json(
        { success: false, message: 'News not found' },
        { status: 404 }
      )
    }

    // Update news
    await newsRef.update({
      title,
      body: newsBody,
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true, message: 'News updated successfully' })
  } catch (error) {
    console.error('Error updating news:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to update news' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    const newsRef = db.collection('news').doc(id)
    
    // Check if news exists and belongs to this domain
    const newsDoc = await newsRef.get()
    if (!newsDoc.exists) {
      return NextResponse.json(
        { success: false, message: 'News not found' },
        { status: 404 }
      )
    }

    const existingData = newsDoc.data()
    if (existingData?.domain !== domain) {
      return NextResponse.json(
        { success: false, message: 'News not found' },
        { status: 404 }
      )
    }

    // Delete news
    await newsRef.delete()

    return NextResponse.json({ success: true, message: 'News deleted successfully' })
  } catch (error) {
    console.error('Error deleting news:', error)
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to delete news' },
      { status: 500 }
    )
  }
}
