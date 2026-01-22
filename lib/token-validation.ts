/**
 * Centralized token validation logic
 * Ensures all APIs use the exact same validation criteria
 */

export function isValidToken(token: any): token is string {
  return token && typeof token === 'string' && token.trim().length > 0
}

export function getTokenValidationReason(token: any): string {
  if (!token) return 'MISSING token field'
  if (typeof token !== 'string') return `Wrong type: ${typeof token}`
  if (token.trim().length === 0) return `Empty string (length: ${token.length})`
  return 'VALID'
}
