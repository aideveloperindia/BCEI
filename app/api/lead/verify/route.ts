import { NextRequest, NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'
import { LeadDocument, getNextPhase } from '@/lib/lead-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('leadId')?.trim() || ''

    if (!leadId) {
      return NextResponse.json({ success: false, message: 'leadId is required.' }, { status: 400 })
    }

    const db = await getMongoDb()
    const lead = await db.collection<LeadDocument>('leads').findOne({ leadId })

    if (!lead) {
      return NextResponse.json({ success: false, message: 'Lead not found.' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      lead: {
        leadId: lead.leadId,
        parentName: lead.parent?.name || '',
        currentPhase: lead.process?.currentPhase || getNextPhase(lead.process),
        completedPhases: lead.process?.completedPhases || [],
        phaseRecords: lead.process?.phaseRecords || [],
        isCompleted: Boolean(lead.process?.isCompleted),
        finalCompletionId: lead.process?.finalCompletionId || null,
        updatedAt: lead.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error verifying lead:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to verify lead. Please try again.' },
      { status: 500 }
    )
  }
}
