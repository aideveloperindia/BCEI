'use client'

import Link from 'next/link'
import { AdmissionStepLayout } from '@/components/admission/AdmissionStepLayout'

export default function AdmissionStartPage() {
  return (
    <AdmissionStepLayout
      title="Get the best possible school fee discount for your child"
      subtitle="School admissions made smarter: we help you secure the best possible fee discounts."
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
          You focus on your child&apos;s future, we focus on negotiating better school fee discounts.
        </p>
        <p>
          Complete this guided flow and our team starts school-side coordination for discount support.
        </p>
        <p>
          New school admission support for transfer families - with discount-focused guidance.
        </p>
      </div>
    </AdmissionStepLayout>
  )
}
