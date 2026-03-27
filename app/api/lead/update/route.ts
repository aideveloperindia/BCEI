import { NextRequest, NextResponse } from 'next/server'
import { getClientConfig } from '@/config/client-firebase-map'
import { getMongoDb } from '@/lib/mongodb'
import { LeadDocument } from '@/lib/lead-server'

export const dynamic = 'force-dynamic'

type UpdatableChild = {
  name?: unknown
  currentClass?: unknown
  nextClass?: unknown
  currentSchool?: unknown
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
    const leadId = typeof body.leadId === 'string' ? body.leadId.trim() : ''

    if (!leadId) {
      return NextResponse.json({ success: false, message: 'leadId is required.' }, { status: 400 })
    }

    const updateSet: Partial<LeadDocument> = {}
    let nextStage: string | null = null

    if (Array.isArray(body.children)) {
      const children = (body.children as UpdatableChild[]).map((child) => ({
        name: typeof child.name === 'string' ? child.name.trim() : '',
        currentClass: typeof child.currentClass === 'string' ? child.currentClass.trim() : '',
        nextClass: typeof child.nextClass === 'string' ? child.nextClass.trim() : '',
        currentSchool: typeof child.currentSchool === 'string' ? child.currentSchool.trim() : '',
      }))

      const hasInvalid = children.some(
        (child) => !child.name || !child.currentClass || !child.nextClass || !child.currentSchool
      )
      if (children.length === 0 || hasInvalid) {
        return NextResponse.json(
          { success: false, message: 'children entries must include all fields.' },
          { status: 400 }
        )
      }

      updateSet.children = children
      nextStage = 'step2_completed'
    }

    if (body.preferences && typeof body.preferences === 'object') {
      const rawPreferences = body.preferences as {
        preferredSchools?: unknown
        budgetRange?: unknown
        transportRequired?: unknown
      }

      const preferredSchools = Array.isArray(rawPreferences.preferredSchools)
        ? rawPreferences.preferredSchools
            .filter((school): school is string => typeof school === 'string')
            .map((school) => school.trim())
            .filter(Boolean)
        : []
      const budgetRange =
        typeof rawPreferences.budgetRange === 'string' ? rawPreferences.budgetRange.trim() : ''
      const transportRequired = Boolean(rawPreferences.transportRequired)

      if (!budgetRange || preferredSchools.length === 0) {
        return NextResponse.json(
          { success: false, message: 'preferences require preferredSchools and budgetRange.' },
          { status: 400 }
        )
      }

      updateSet.preferences = {
        preferredSchools,
        budgetRange,
        transportRequired,
      }
      nextStage = 'step3_completed'
    }

    if (!updateSet.children && !updateSet.preferences) {
      return NextResponse.json(
        { success: false, message: 'Provide children or preferences to update.' },
        { status: 400 }
      )
    }

    const db = await getMongoDb()
    const leadsCollection = db.collection<LeadDocument>('leads')
    const currentLead = await leadsCollection.findOne({ leadId }, { projection: { status: 1 } })
    if (!currentLead) {
      return NextResponse.json({ success: false, message: 'Lead not found.' }, { status: 404 })
    }

    const updatedStatus = {
      ...currentLead.status,
      stage: nextStage || currentLead.status.stage,
    }

    const result = await leadsCollection.updateOne(
      { leadId },
      {
        $set: {
          ...updateSet,
          status: updatedStatus,
          updatedAt: new Date(),
        },
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: 'Lead not found.' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Lead updated successfully',
    })
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update lead. Please try again.' },
      { status: 500 }
    )
  }
}
