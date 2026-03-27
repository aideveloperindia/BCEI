'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdmissionStepLayout } from '@/components/admission/AdmissionStepLayout'
import { getStoredLeadId } from '@/lib/admission-lead'

export default function AdmissionConfirmationPage() {
  const router = useRouter()
  const [leadId, setLeadId] = useState<string | null>(null)

  useEffect(() => {
    const storedLeadId = getStoredLeadId()
    if (!storedLeadId) {
      router.replace('/admission/form-step-1')
      return
    }
    setLeadId(storedLeadId)
  }, [router])

  return (
    <AdmissionStepLayout
      title="Your Admission Benefits are Activated"
      subtitle="Show this ID at the school during admission to unlock your eligible benefits."
      stepLabel="Completed"
      backHref="/admission/form-step-3"
      cta={
        <button
          onClick={() => router.push('/')}
          className="w-full rounded-lg bg-white px-5 py-4 text-base font-semibold text-black transition hover:bg-white/90"
        >
          Continue
        </button>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-white/20 bg-white/5 p-5 text-center">
          <p className="text-xs uppercase tracking-widest text-white/70">Lead ID</p>
          <p className="mt-2 break-all text-3xl font-bold text-white">{leadId || 'Loading...'}</p>
        </div>

        <p className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/80">
          Keep this ID handy. Our team and participating schools use it to identify your benefit
          journey quickly.
        </p>
      </div>
    </AdmissionStepLayout>
  )
}
