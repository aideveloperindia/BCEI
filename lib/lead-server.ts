import { Db } from 'mongodb'

export const LEAD_PHASES = ['P1_CALL', 'P2_VISIT', 'P3_ADMISSION_CONFIRM'] as const
export type LeadPhase = (typeof LEAD_PHASES)[number]

export interface LeadPhaseRecord {
  phase: LeadPhase
  ackId: string
  schoolName: string
  createdAt: Date
}

export interface LeadProcessState {
  currentPhase: LeadPhase
  completedPhases: LeadPhase[]
  phaseRecords: LeadPhaseRecord[]
  isCompleted: boolean
  finalCompletionId?: string
}

export interface LeadDocument {
  leadId: string
  parent: {
    name: string
    phone: string
    area: string
  }
  children: Array<{
    name: string
    currentClass: string
    nextClass: string
    currentSchool: string
  }>
  preferences: {
    preferredSchools: string[]
    budgetRange: string
    transportRequired: boolean
  }
  status: {
    stage: string
    notificationAllowed: boolean
  }
  process: LeadProcessState
  createdAt: Date
  updatedAt: Date
}

function randomLeadSuffix(): string {
  return `${Math.floor(Math.random() * 10000)}`.padStart(4, '0')
}

export async function generateUniqueLeadId(db: Db): Promise<string> {
  const leadsCollection = db.collection<LeadDocument>('leads')
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const leadId = `KRMR-${randomLeadSuffix()}`
    const existing = await leadsCollection.findOne({ leadId }, { projection: { _id: 1 } })
    if (!existing) {
      return leadId
    }
  }

  throw new Error('Unable to generate unique lead ID')
}

export function getNextPhase(process?: Partial<LeadProcessState> | null): LeadPhase {
  const completed = process?.completedPhases || []
  const next = LEAD_PHASES.find((phase) => !completed.includes(phase))
  return next || 'P3_ADMISSION_CONFIRM'
}

export function generateAckId(phase: LeadPhase): string {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `ACK-${phase.replace('P', '')}-${suffix}`
}

export function generateFinalCompletionId(): string {
  return `COMP-${Date.now().toString(36).toUpperCase()}`
}
