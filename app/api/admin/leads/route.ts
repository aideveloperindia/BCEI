import { NextRequest, NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'
import { LeadDocument, getNextPhase } from '@/lib/lead-server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')?.trim() || ''
    const area = searchParams.get('area')?.trim() || ''
    const classFilter = searchParams.get('class')?.trim() || ''
    const preferredSchool = searchParams.get('preferredSchool')?.trim() || ''

    const filters: Record<string, unknown> = {}

    if (query) {
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filters.$or = [
        { leadId: { $regex: escaped, $options: 'i' } },
        { 'parent.phone': { $regex: escaped, $options: 'i' } },
      ]
    }

    if (area) {
      filters['parent.area'] = { $regex: `^${area.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
    }

    if (classFilter) {
      const escaped = classFilter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filters.$and = [
        ...(Array.isArray(filters.$and) ? (filters.$and as Record<string, unknown>[]) : []),
        {
          $or: [
            { 'children.currentClass': { $regex: escaped, $options: 'i' } },
            { 'children.nextClass': { $regex: escaped, $options: 'i' } },
          ],
        },
      ]
    }

    if (preferredSchool) {
      const escaped = preferredSchool.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filters.$and = [
        ...(Array.isArray(filters.$and) ? (filters.$and as Record<string, unknown>[]) : []),
        { 'preferences.preferredSchools': { $elemMatch: { $regex: escaped, $options: 'i' } } },
      ]
    }

    const db = await getMongoDb()
    const leads = await db
      .collection<LeadDocument>('leads')
      .find(filters)
      .sort({ updatedAt: -1 })
      .limit(500)
      .toArray()

    return NextResponse.json({
      success: true,
      leads: leads.map((lead) => ({
        leadId: lead.leadId,
        parent: lead.parent,
        children: lead.children || [],
        preferences: lead.preferences,
        status: lead.status,
        process: {
          currentPhase: lead.process?.currentPhase || getNextPhase(lead.process),
          completedPhases: lead.process?.completedPhases || [],
          phaseRecords: lead.process?.phaseRecords || [],
          isCompleted: Boolean(lead.process?.isCompleted),
          finalCompletionId: lead.process?.finalCompletionId || null,
        },
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
      })),
    })
  } catch (error) {
    console.error('Error fetching leads:', error)
    // Avoid hard-failing admin UI on transient DB/auth/network issues.
    return NextResponse.json({
      success: false,
      message: 'Leads are temporarily unavailable. Please retry in a few seconds.',
      leads: [],
    })
  }
}
