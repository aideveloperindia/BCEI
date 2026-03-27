import { NextRequest, NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'
import {
  LEAD_PHASES,
  LeadDocument,
  LeadPhase,
  generateAckId,
  generateFinalCompletionId,
  getNextPhase,
} from '@/lib/lead-server'
import { SchoolAdminDocument } from '@/lib/school-admin'

export const dynamic = 'force-dynamic'

type RequestBody = {
  leadId?: string
  phase?: LeadPhase
  schoolId?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RequestBody
    const leadId = typeof body.leadId === 'string' ? body.leadId.trim() : ''
    const phase = body.phase
    const schoolId = typeof body.schoolId === 'string' ? body.schoolId.trim() : ''

    if (!leadId || !phase || !LEAD_PHASES.includes(phase)) {
      return NextResponse.json(
        { success: false, message: 'leadId and valid phase are required.' },
        { status: 400 }
      )
    }

    if (!schoolId) {
      return NextResponse.json(
        { success: false, message: 'schoolId is required.' },
        { status: 400 }
      )
    }

    const db = await getMongoDb()
    const school = await db
      .collection<SchoolAdminDocument>('school_admins')
      .findOne({ schoolId, isActive: true })
    if (!school) {
      return NextResponse.json({ success: false, message: 'Invalid school admin session.' }, { status: 401 })
    }

    const leadsCollection = db.collection<LeadDocument>('leads')
    const lead = await leadsCollection.findOne({ leadId })

    if (!lead) {
      return NextResponse.json({ success: false, message: 'Lead not found.' }, { status: 404 })
    }

    const completedPhases = lead.process?.completedPhases || []
    const phaseRecords = lead.process?.phaseRecords || []

    if (completedPhases.includes(phase)) {
      return NextResponse.json(
        { success: false, message: `${phase} already completed for this lead.` },
        { status: 409 }
      )
    }

    const expectedPhase = getNextPhase(lead.process)
    if (phase !== expectedPhase) {
      return NextResponse.json(
        { success: false, message: `Invalid phase order. Expected ${expectedPhase}.` },
        { status: 409 }
      )
    }

    const ackId = generateAckId(phase)
    const now = new Date()
    const updatedCompletedPhases = [...completedPhases, phase]
    const isCompleted = updatedCompletedPhases.length === LEAD_PHASES.length
    const finalCompletionId = isCompleted
      ? lead.process?.finalCompletionId || generateFinalCompletionId()
      : undefined

    const nextPhase = isCompleted
      ? 'P3_ADMISSION_CONFIRM'
      : LEAD_PHASES[updatedCompletedPhases.length]

    await leadsCollection.updateOne(
      { leadId },
      {
        $set: {
          process: {
            currentPhase: nextPhase,
            completedPhases: updatedCompletedPhases,
            phaseRecords: [
              ...phaseRecords,
              {
                phase,
                ackId,
                schoolName: school.schoolName,
                createdAt: now,
              },
            ],
            isCompleted,
            ...(finalCompletionId ? { finalCompletionId } : {}),
          },
          status: {
            ...lead.status,
            stage: isCompleted ? 'admission_process_completed' : `lead_phase_${phase.toLowerCase()}`,
          },
          updatedAt: now,
        },
      }
    )

    return NextResponse.json({
      success: true,
      leadId,
      phase,
      ackId,
      isCompleted,
      finalCompletionId: finalCompletionId || null,
      nextPhase: isCompleted ? null : nextPhase,
      message: isCompleted
        ? 'Final phase completed. Lead lifecycle is complete.'
        : `${phase} completed successfully.`,
    })
  } catch (error) {
    console.error('Error processing school lead phase:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to process lead phase. Please try again.' },
      { status: 500 }
    )
  }
}
