import { NextRequest, NextResponse } from 'next/server'
import { getClientConfig } from '@/config/client-firebase-map'
import { getMongoDb } from '@/lib/mongodb'
import { LeadDocument, generateUniqueLeadId } from '@/lib/lead-server'

export const dynamic = 'force-dynamic'

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
    const parentName = typeof body.parentName === 'string' ? body.parentName.trim() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
    const area = typeof body.area === 'string' ? body.area.trim() : ''

    if (!parentName || !phone || !area) {
      return NextResponse.json(
        { success: false, message: 'parentName, phone, and area are required.' },
        { status: 400 }
      )
    }

    const db = await getMongoDb()
    const leadId = await generateUniqueLeadId(db)
    const now = new Date()

    const lead: LeadDocument = {
      leadId,
      parent: {
        name: parentName,
        phone,
        area,
      },
      children: [],
      preferences: {
        preferredSchools: [],
        budgetRange: '',
        transportRequired: false,
      },
      status: {
        stage: 'step1_completed',
        notificationAllowed: false,
      },
      createdAt: now,
      updatedAt: now,
    }

    await db.collection<LeadDocument>('leads').insertOne(lead)

    return NextResponse.json({
      success: true,
      leadId,
      message: 'Lead created successfully',
    })
  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create lead. Please try again.' },
      { status: 500 }
    )
  }
}
