'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdmissionStepLayout } from '@/components/admission/AdmissionStepLayout'
import { setStoredLeadId } from '@/lib/admission-lead'

export default function AdmissionFormStep1Page() {
  const router = useRouter()
  const [parentName, setParentName] = useState('')
  const [phone, setPhone] = useState('')
  const [area, setArea] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/lead/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentName, phone, area }),
      })
      const data = await response.json()

      if (!response.ok || !data.success || !data.leadId) {
        setError(data.message || 'Failed to save details. Please try again.')
        return
      }

      setStoredLeadId(data.leadId)
      router.push('/admission/form-step-2')
    } catch (submitError) {
      console.error('Step 1 save failed', submitError)
      setError('Failed to save details. Please check your connection and try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AdmissionStepLayout
      title="Parent Details"
      subtitle="Tell us where to contact you for admission support."
      stepLabel="Step 3/5"
      backHref="/admission/benefits"
      cta={
        <button
          type="submit"
          form="admission-step-1-form"
          disabled={isSaving}
          className="w-full rounded-lg bg-white px-5 py-4 text-base font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? 'Saving...' : 'Continue'}
        </button>
      }
    >
      <form id="admission-step-1-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm text-white/80">Parent Name</label>
          <input
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white outline-none focus:border-white/50"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm text-white/80">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white outline-none focus:border-white/50"
            inputMode="numeric"
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm text-white/80">Area</label>
          <input
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white outline-none focus:border-white/50"
            required
          />
        </div>
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
      </form>
    </AdmissionStepLayout>
  )
}
