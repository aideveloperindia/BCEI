'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdmissionStepLayout } from '@/components/admission/AdmissionStepLayout'
import { getStoredLeadId } from '@/lib/admission-lead'

export default function AdmissionFormStep3Page() {
  const router = useRouter()
  const [leadId, setLeadId] = useState<string | null>(null)
  const [preferredSchoolsInput, setPreferredSchoolsInput] = useState('')
  const [budgetRange, setBudgetRange] = useState('')
  const [transportRequired, setTransportRequired] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const storedLeadId = getStoredLeadId()
    if (!storedLeadId) {
      router.replace('/admission/form-step-1')
      return
    }
    setLeadId(storedLeadId)
  }, [router])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!leadId) return

    setIsSaving(true)
    setError(null)

    const preferredSchools = preferredSchoolsInput
      .split(',')
      .map((school) => school.trim())
      .filter(Boolean)

    try {
      const response = await fetch('/api/lead/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          preferences: {
            preferredSchools,
            budgetRange,
            transportRequired,
          },
        }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        setError(data.message || 'Failed to save preferences.')
        return
      }
      router.push('/admission/confirmation')
    } catch (submitError) {
      console.error('Step 3 save failed', submitError)
      setError('Failed to save preferences. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AdmissionStepLayout
      title="Admission Preferences"
      subtitle="Share school and budget preferences for better matching."
      stepLabel="Step 5/5"
      backHref="/admission/form-step-2"
      cta={
        <button
          type="submit"
          form="admission-step-3-form"
          disabled={isSaving || !leadId}
          className="w-full rounded-lg bg-white px-5 py-4 text-base font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? 'Saving...' : 'Activate Benefits'}
        </button>
      }
    >
      <form id="admission-step-3-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm text-white/80">
            Preferred Schools (comma separated)
          </label>
          <textarea
            rows={3}
            value={preferredSchoolsInput}
            onChange={(e) => setPreferredSchoolsInput(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white outline-none focus:border-white/50"
            placeholder="School A, School B, School C"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm text-white/80">Budget Range</label>
          <input
            value={budgetRange}
            onChange={(e) => setBudgetRange(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white outline-none focus:border-white/50"
            placeholder="e.g. 50,000 - 1,00,000 per year"
            required
          />
        </div>
        <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
          <input
            type="checkbox"
            checked={transportRequired}
            onChange={(e) => setTransportRequired(e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm text-white/85">Transport Required</span>
        </label>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
      </form>
    </AdmissionStepLayout>
  )
}
