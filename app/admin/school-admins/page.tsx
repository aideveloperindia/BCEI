'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { AdminProtection } from '@/components/AdminProtection'

type SchoolAdmin = {
  schoolId: string
  schoolName: string
  username: string
  password: string
  isActive: boolean
  createdAt: string
  lastLoginAt?: string | null
}

export default function AdminSchoolAdminsPage() {
  return (
    <AdminProtection>
      <AdminSchoolAdminsContent />
    </AdminProtection>
  )
}

function AdminSchoolAdminsContent() {
  const [schoolName, setSchoolName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [schoolAdmins, setSchoolAdmins] = useState<SchoolAdmin[]>([])
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const fetchSchoolAdmins = async () => {
    const response = await fetch('/api/admin/school-admins')
    const data = await response.json()
    if (response.ok && data.success) {
      setSchoolAdmins(data.schoolAdmins || [])
    }
  }

  useEffect(() => {
    fetchSchoolAdmins()
  }, [])

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    setResult(null)
    try {
      const response = await fetch('/api/admin/school-admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolName }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        setResult({ success: false, message: data.message || 'Failed to create school admin.' })
        return
      }
      setResult({
        success: true,
        message: `Created ${data.schoolAdmin.schoolName} login: ${data.schoolAdmin.username} / ${data.schoolAdmin.password}`,
      })
      setSchoolName('')
      fetchSchoolAdmins()
    } catch {
      setResult({ success: false, message: 'Failed to create school admin.' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-black p-4 text-white">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">School Admin Credentials</h1>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/admin/push-notifications" className="text-white/70 underline hover:text-white">Push</Link>
            <Link href="/admin/news" className="text-white/70 underline hover:text-white">News</Link>
            <Link href="/admin/leads" className="text-white/70 underline hover:text-white">Leads</Link>
          </div>
        </div>

        <form onSubmit={handleCreate} className="rounded-xl border border-white/10 bg-white/5 p-5">
          <label className="mb-2 block text-sm text-white/80">School Name</label>
          <div className="flex gap-2">
            <input
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="Example: ABC High School"
              className="flex-1 rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm outline-none focus:border-white/40"
              required
            />
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-60"
            >
              {isSaving ? 'Creating...' : 'Create School Admin'}
            </button>
          </div>
        </form>

        {result ? (
          <div
            className={`rounded-lg p-3 text-sm ${
              result.success ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'
            }`}
          >
            {result.message}
          </div>
        ) : null}

        <div className="space-y-3">
          {schoolAdmins.map((school) => (
            <div key={school.schoolId} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
              <p className="text-lg font-semibold">{school.schoolName}</p>
              <p className="text-white/80">Username: {school.username}</p>
              <p className="text-white/80">Password: {school.password}</p>
              <p className="text-white/60">
                Last login: {school.lastLoginAt ? new Date(school.lastLoginAt).toLocaleString() : 'Never'}
              </p>
            </div>
          ))}
          {schoolAdmins.length === 0 ? <p className="text-sm text-white/60">No school admins created yet.</p> : null}
        </div>
      </div>
    </main>
  )
}
