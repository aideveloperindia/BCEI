'use client'

import Link from 'next/link'
import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { SiteNavbar } from '@/components/site/SiteNavbar'
import { fadeUp } from '@/lib/motion'

interface AdmissionStepLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
  stepLabel?: string
  cta?: ReactNode
  backHref?: string
  backLabel?: string
}

export function AdmissionStepLayout({
  title,
  subtitle,
  children,
  stepLabel,
  cta,
  backHref = '/',
  backLabel = 'Back',
}: AdmissionStepLayoutProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteNavbar />
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 pb-28 pt-28 md:pt-32">
        <motion.div
          {...fadeUp(0)}
          className="liquid-glass mb-6 flex items-center justify-between rounded-full px-4 py-3 text-sm text-white/70"
        >
          <Link href={backHref} className="underline underline-offset-4 hover:text-white">
            {backLabel}
          </Link>
          {stepLabel ? <span>{stepLabel}</span> : <span />}
        </motion.div>

        <motion.div {...fadeUp(0.05)} className="mb-6 space-y-2">
          <h1 className="text-2xl font-semibold leading-tight">{title}</h1>
          {subtitle ? <p className="text-sm text-white/75">{subtitle}</p> : null}
        </motion.div>

        <motion.div {...fadeUp(0.1)} className="flex-1">
          {children}
        </motion.div>
      </div>

      {cta ? (
        <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-black/95 p-4 backdrop-blur">
          <div className="mx-auto w-full max-w-xl">{cta}</div>
        </div>
      ) : null}
    </main>
  )
}
