import { Db } from 'mongodb'

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
