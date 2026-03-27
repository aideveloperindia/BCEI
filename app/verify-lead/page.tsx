'use client'

import { FormEvent, useState } from 'react'

type LeadPhaseRecord = {
  phase: string
  ackId: string
  schoolName: string
  createdAt: string
}

type VerifiedLead = {
  leadId: string
  parentName: string
  currentPhase: string
  completedPhases: string[]
  phaseRecords: LeadPhaseRecord[]
  isCompleted: boolean
  finalCompletionId?: string | null
  updatedAt: string
}

export default function VerifyLeadPage() {
  const [leadId, setLeadId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lead, setLead] = useState<VerifiedLead | null>(null)

  const handleVerify = async (event: FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)
    setLead(null)

    try {
      const response = await fetch(`/api/lead/verify?leadId=${encodeURIComponent(leadId.trim())}`)
      const data = await response.json()
      if (!response.ok || !data.success) {
        setError(data.message || 'Failed to verify lead.')
        return
      }
      setLead(data.lead as VerifiedLead)
    } catch {
      setError('Failed to verify lead.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-black p-4 text-white">
      <div className="mx-auto max-w-3xl space-y-6 pt-8">
        <h1 className="text-3xl font-semibold">Lead Verification</h1>

        <form onSubmit={handleVerify} className="rounded-xl border border-white/10 bg-white/5 p-4">
          <label className="mb-2 block text-sm text-white/80">Lead ID</label>
          <div className="flex gap-2">
            <input
              value={leadId}
              onChange={(e) => setLeadId(e.target.value.toUpperCase())}
              placeholder="Example: KRMR-1234"
              className="flex-1 rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm outline-none focus:border-white/40"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-60"
            >
              {isLoading ? 'Checking...' : 'Verify'}
            </button>
          </div>
        </form>

        {error ? <div className="rounded-lg bg-red-500/20 p-3 text-sm text-red-200">{error}</div> : null}

        {lead ? (
          <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="grid gap-2 text-sm md:grid-cols-2">
              <p>Lead ID: <span className="font-semibold">{lead.leadId}</span></p>
              <p>Parent: <span className="font-semibold">{lead.parentName || '-'}</span></p>
              <p>Current Phase: <span className="font-semibold">{lead.currentPhase}</span></p>
              <p>Status: <span className="font-semibold">{lead.isCompleted ? 'Completed' : 'In Progress'}</span></p>
            </div>

            {lead.finalCompletionId ? (
              <p className="rounded border border-green-400/40 bg-green-500/10 px-3 py-2 text-sm text-green-200">
                Final Completion ID: {lead.finalCompletionId}
              </p>
            ) : null}

            <div>
              <p className="mb-2 text-sm text-white/70">Phase acknowledgements</p>
              {lead.phaseRecords?.length ? (
                <div className="space-y-2">
                  {lead.phaseRecords.map((record) => (
                    <div key={`${record.phase}-${record.ackId}`} className="rounded border border-white/10 bg-black/20 p-3 text-sm">
                      <p className="font-semibold">{record.phase}</p>
                      <p>ACK ID: {record.ackId}</p>
                      <p>School: {record.schoolName}</p>
                      <p className="text-white/60">{new Date(record.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/60">No completed phases yet.</p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </main>
  )
}
