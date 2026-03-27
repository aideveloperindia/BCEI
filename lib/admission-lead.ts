export const ADMISSION_LEAD_STORAGE_KEY = 'admissionLeadId'

export interface LeadChild {
  name: string
  currentClass: string
  nextClass: string
  currentSchool: string
}

export interface LeadPreferences {
  preferredSchools: string[]
  budgetRange: string
  transportRequired: boolean
}

export function getStoredLeadId(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(ADMISSION_LEAD_STORAGE_KEY)
}

export function setStoredLeadId(leadId: string): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ADMISSION_LEAD_STORAGE_KEY, leadId)
}
