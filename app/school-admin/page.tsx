'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { SchoolAdminProtection } from '@/components/SchoolAdminProtection'

const phases = [
  { id: 'P1_CALL', label: 'P1_CALL - Parent Call' },
  { id: 'P2_VISIT', label: 'P2_VISIT - Parent Visit' },
  { id: 'P3_ADMISSION_CONFIRM', label: 'P3_ADMISSION_CONFIRM - Admission Confirm' },
] as const

export default function SchoolAdminPage() {
  const [leadId, setLeadId] = useState('')
  const [schoolAdmin] = useState<{
    schoolId: string
    schoolName: string
    username: string
  } | null>(() => {
    if (typeof window === 'undefined') return null
    const raw = sessionStorage.getItem('school_admin')
    return raw ? JSON.parse(raw) : null
  })
  const [phase, setPhase] = useState<(typeof phases)[number]['id']>('P1_CALL')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    ackId?: string
    nextPhase?: string | null
    finalCompletionId?: string | null
  } | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setResult(null)

    try {
      const response = await fetch('/api/school/lead-phase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: leadId.trim(),
          schoolId: schoolAdmin?.schoolId,
          phase,
        }),
      })
      const data = await response.json()
      setResult({
        success: response.ok && data.success,
        message: data.message || 'Request completed.',
        ackId: data.ackId,
        nextPhase: data.nextPhase ?? null,
        finalCompletionId: data.finalCompletionId ?? null,
      })
    } catch (error) {
      setResult({ success: false, message: 'Failed to submit. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SchoolAdminProtection>
    <main className="min-h-screen bg-black p-4 text-white">
      <div className="mx-auto max-w-2xl space-y-6 pt-8">
        <div>
          <h1 className="text-3xl font-semibold">School Admin Portal</h1>
          <p className="mt-2 text-sm text-white/70">
            Enter parent Lead ID and phase to generate acknowledgement ID.
          </p>
          {schoolAdmin ? (
            <p className="mt-1 text-xs text-white/60">
              Logged in as: {schoolAdmin.schoolName} ({schoolAdmin.username})
            </p>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-5">
          <div>
            <label className="mb-2 block text-sm text-white/80">Lead ID</label>
            <input
              value={leadId}
              onChange={(e) => setLeadId(e.target.value.toUpperCase())}
              placeholder="Example: KRMR-1234"
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm outline-none focus:border-white/40"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-white/80">Phase</label>
            <select
              value={phase}
              onChange={(e) => setPhase(e.target.value as (typeof phases)[number]['id'])}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm outline-none focus:border-white/40"
            >
              {phases.map((item) => (
                <option key={item.id} value={item.id} className="bg-black text-white">
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-60"
          >
            {isSubmitting ? 'Submitting...' : 'Generate Acknowledgement ID'}
          </button>
        </form>

        {result ? (
          <div
            className={`rounded-xl border p-4 text-sm ${
              result.success
                ? 'border-green-400/40 bg-green-500/10 text-green-200'
                : 'border-red-400/40 bg-red-500/10 text-red-200'
            }`}
          >
            <p className="font-semibold">{result.message}</p>
            {result.ackId ? <p className="mt-2">ACK ID: {result.ackId}</p> : null}
            {result.nextPhase ? <p className="mt-1">Next phase: {result.nextPhase}</p> : null}
            {result.finalCompletionId ? (
              <p className="mt-1">Final Completion ID: {result.finalCompletionId}</p>
            ) : null}
          </div>
        ) : null}

        <div className="text-sm text-white/70">
          Need lead verification? <Link href="/verify-lead" className="underline">Open verify page</Link>.
        </div>
      </div>
    </main>
    </SchoolAdminProtection>
  )
}
