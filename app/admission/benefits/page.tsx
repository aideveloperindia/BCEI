'use client'

import Link from 'next/link'
import { AdmissionStepLayout } from '@/components/admission/AdmissionStepLayout'

const stages = [
  'Visit School -> Unlock Benefit',
  'Admission Discussion -> Unlock Benefit',
  'Confirm Admission -> Unlock Final Benefit',
]

export default function AdmissionBenefitsPage() {
  return (
    <AdmissionStepLayout
      title="Admission Benefit Journey"
      subtitle="Your child&apos;s admission, your advantage - we work with schools to unlock fee discounts for you."
      stepLabel="Step 2/5"
      backHref="/admission/start"
      cta={
        <Link
          href="/admission/form-step-1"
          className="block w-full rounded-lg bg-white px-5 py-4 text-center text-base font-semibold text-black transition hover:bg-white/90"
        >
          Start Form
        </Link>
      }
    >
      <div className="space-y-4">
        <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-5">
          {stages.map((stage, index) => (
            <div key={stage} className="rounded-md border border-white/10 bg-black/30 p-3">
              <p className="text-sm text-white/80">
                <span className="mr-2 font-semibold text-white">{index + 1}.</span>
                {stage}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-white/20 bg-white/5 p-4">
          <p className="text-xs leading-relaxed text-white/85">
            Better admissions start here: expert support to negotiate school fee discounts for parents.
            {' '}
            Switch your child to a better school with expert admission help and fee discount support.
            {' '}
            We do not guarantee or promise fixed discounts. We assist parents in accessing
            admission benefits offered by participating schools. Benefits are subject to school
            participation, seat availability, admission policies, and eligibility criteria,
            including entrance tests where applicable. Final benefits are confirmed only upon
            successful admission.
          </p>
        </div>
      </div>
    </AdmissionStepLayout>
  )
}
