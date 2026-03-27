export interface SchoolAdminDocument {
  schoolId: string
  schoolName: string
  username: string
  password: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 18)
}

function randomSegment(length: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let output = ''
  for (let i = 0; i < length; i += 1) {
    output += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return output
}

export function generateSchoolAdminCredentials(schoolName: string) {
  const base = slugify(schoolName) || 'school'
  const username = `${base}-${randomSegment(4).toLowerCase()}`
  const password = `SCH-${randomSegment(8)}`
  const schoolId = `SCH-${Date.now().toString(36).toUpperCase()}`
  return { schoolId, username, password }
}
