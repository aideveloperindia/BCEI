'use client'

import Link from 'next/link'
import { AdmissionStepLayout } from '@/components/admission/AdmissionStepLayout'

export default function AdmissionStartPage() {
  return (
    <AdmissionStepLayout
      title="Get Admission Benefits for Top Schools in Karimnagar"
      subtitle="A short 3-step form helps us match your child with participating schools."
      stepLabel="Step 1/5"
      backHref="/"
      backLabel="Home"
      cta={
        <Link
          href="/admission/benefits"
          className="block w-full rounded-lg bg-white px-5 py-4 text-center text-base font-semibold text-black transition hover:bg-white/90"
        >
          Continue
        </Link>
      }
    >
      <div className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-5 text-sm text-white/80">
        <p>
          Schools share admission benefits only with eligible families. Complete this guided flow to
          unlock updates and support.
        </p>
        <p>
          You will receive a unique Lead ID that you can show during admission discussions.
        </p>
      </div>
    </AdmissionStepLayout>
  )
}
