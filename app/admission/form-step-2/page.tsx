'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdmissionStepLayout } from '@/components/admission/AdmissionStepLayout'
import { LeadChild, getStoredLeadId } from '@/lib/admission-lead'

function emptyChild(): LeadChild {
  return {
    name: '',
    currentClass: '',
    nextClass: '',
    currentSchool: '',
  }
}

export default function AdmissionFormStep2Page() {
  const router = useRouter()
  const [leadId, setLeadId] = useState<string | null>(null)
  const [children, setChildren] = useState<LeadChild[]>([emptyChild()])
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

  const handleChildChange = (index: number, key: keyof LeadChild, value: string) => {
    setChildren((previous) =>
      previous.map((child, childIndex) =>
        childIndex === index ? { ...child, [key]: value } : child
      )
    )
  }

  const addAnotherChild = () => {
    setChildren((previous) => [...previous, emptyChild()])
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!leadId) return

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/lead/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, children }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        setError(data.message || 'Failed to save children details.')
        return
      }
      router.push('/admission/form-step-3')
    } catch (submitError) {
      console.error('Step 2 save failed', submitError)
      setError('Failed to save details. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AdmissionStepLayout
      title="Children Details"
      subtitle="Add your child details so we can match class-wise admission options."
      stepLabel="Step 4/5"
      backHref="/admission/form-step-1"
      cta={
        <button
          type="submit"
          form="admission-step-2-form"
          disabled={isSaving || !leadId}
          className="w-full rounded-lg bg-white px-5 py-4 text-base font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? 'Saving...' : 'Continue'}
        </button>
      }
    >
      <form id="admission-step-2-form" onSubmit={handleSubmit} className="space-y-4">
        {children.map((child, index) => (
          <div key={`child-${index}`} className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium text-white/90">Child {index + 1}</p>
            <input
              value={child.name}
              onChange={(e) => handleChildChange(index, 'name', e.target.value)}
              placeholder="Child Name"
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white outline-none focus:border-white/50"
              required
            />
            <input
              value={child.currentClass}
              onChange={(e) => handleChildChange(index, 'currentClass', e.target.value)}
              placeholder="Current Class"
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white outline-none focus:border-white/50"
              required
            />
            <input
              value={child.nextClass}
              onChange={(e) => handleChildChange(index, 'nextClass', e.target.value)}
              placeholder="Next Class"
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white outline-none focus:border-white/50"
              required
            />
            <input
              value={child.currentSchool}
              onChange={(e) => handleChildChange(index, 'currentSchool', e.target.value)}
              placeholder="Current School"
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white outline-none focus:border-white/50"
              required
            />
          </div>
        ))}

        <button
          type="button"
          onClick={addAnotherChild}
          className="w-full rounded-lg border border-white/30 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
        >
          Add Another Child
        </button>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}
      </form>
    </AdmissionStepLayout>
  )
}
