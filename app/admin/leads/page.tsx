'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AdminProtection } from '@/components/AdminProtection'

interface AdminLead {
  leadId: string
  parent: {
    name: string
    phone: string
    area: string
  }
  children: Array<{
    name: string
    currentClass: string
    nextClass: string
    currentSchool: string
  }>
  preferences: {
    preferredSchools: string[]
    budgetRange: string
    transportRequired: boolean
  }
  status: {
    stage: string
    notificationAllowed: boolean
  }
  createdAt: string
  updatedAt: string
}

export default function AdminLeadsPage() {
  return (
    <AdminProtection>
      <AdminLeadsContent />
    </AdminProtection>
  )
}

function AdminLeadsContent() {
  const [query, setQuery] = useState('')
  const [area, setArea] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [preferredSchool, setPreferredSchool] = useState('')
  const [leads, setLeads] = useState<AdminLead[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLeads = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (query.trim()) params.set('query', query.trim())
      if (area.trim()) params.set('area', area.trim())
      if (classFilter.trim()) params.set('class', classFilter.trim())
      if (preferredSchool.trim()) params.set('preferredSchool', preferredSchool.trim())

      const response = await fetch(`/api/admin/leads?${params.toString()}`)
      const data = await response.json()
      if (!response.ok || !data.success) {
        setError(data.message || 'Failed to load leads.')
        return
      }
      setLeads(data.leads || [])
    } catch (requestError) {
      console.error('Failed to load leads', requestError)
      setError('Failed to load leads.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLeads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const childrenCount = useMemo(
    () => leads.reduce((total, lead) => total + (lead.children?.length || 0), 0),
    [leads]
  )

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault()
    await fetchLeads()
  }

  return (
    <main className="min-h-screen bg-black p-4 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col space-y-6">
        <div className="mx-auto h-20 w-20 overflow-hidden rounded-full bg-white ring-2 ring-white/20">
          <Image
            src="/logo.png"
            alt="Any School Fee Discount Logo"
            width={80}
            height={80}
            className="h-full w-full object-cover"
            unoptimized
          />
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Admission Leads</h1>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/admin/news" className="text-white/70 underline hover:text-white">
              News
            </Link>
            <Link href="/admin/push-notifications" className="text-white/70 underline hover:text-white">
              Push
            </Link>
          </div>
        </div>

        <form onSubmit={handleSearch} className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search phone or leadId"
              className="rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none focus:border-white/50"
            />
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Filter by area"
              className="rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none focus:border-white/50"
            />
            <input
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              placeholder="Filter by class"
              className="rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none focus:border-white/50"
            />
            <input
              value={preferredSchool}
              onChange={(e) => setPreferredSchool(e.target.value)}
              placeholder="Filter by preferred school"
              className="rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none focus:border-white/50"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Loading...' : 'Apply Search & Filters'}
          </button>
        </form>

        <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-white/80">
          Leads: <span className="font-semibold text-white">{leads.length}</span> | Children tracked:{' '}
          <span className="font-semibold text-white">{childrenCount}</span>
        </div>

        {error ? <div className="rounded-lg bg-red-500/20 p-3 text-sm text-red-200">{error}</div> : null}

        <div className="space-y-3">
          {!isLoading && leads.length === 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-center text-sm text-white/60">
              No leads found for current filters.
            </div>
          ) : (
            leads.map((lead) => (
              <div key={lead.leadId} className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-white/70">Lead ID</p>
                    <p className="font-semibold">{lead.leadId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/60">Stage: {lead.status?.stage || '-'}</p>
                    <p className="text-xs text-white/60">
                      Notifications: {lead.status?.notificationAllowed ? 'Allowed' : 'Pending'}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 text-sm md:grid-cols-2">
                  <div className="rounded border border-white/10 bg-black/20 p-3">
                    <p className="text-white/60">Parent</p>
                    <p className="font-medium">{lead.parent?.name}</p>
                    <p className="text-white/80">{lead.parent?.phone}</p>
                    <p className="text-white/70">{lead.parent?.area}</p>
                  </div>
                  <div className="rounded border border-white/10 bg-black/20 p-3">
                    <p className="text-white/60">Preferences</p>
                    <p className="text-white/80">Budget: {lead.preferences?.budgetRange || '-'}</p>
                    <p className="text-white/80">
                      Transport: {lead.preferences?.transportRequired ? 'Required' : 'Not required'}
                    </p>
                    <p className="text-white/80">
                      Schools: {(lead.preferences?.preferredSchools || []).join(', ') || '-'}
                    </p>
                  </div>
                </div>

                <div className="rounded border border-white/10 bg-black/20 p-3">
                  <p className="mb-2 text-sm text-white/60">Children Summary</p>
                  {lead.children?.length ? (
                    <div className="space-y-2 text-sm">
                      {lead.children.map((child, index) => (
                        <div key={`${lead.leadId}-${index}`} className="rounded border border-white/10 p-2">
                          <p className="font-medium">{child.name}</p>
                          <p className="text-white/75">
                            {child.currentClass} {'->'} {child.nextClass}
                          </p>
                          <p className="text-white/70">{child.currentSchool}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-white/60">No children data added yet.</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  )
}
