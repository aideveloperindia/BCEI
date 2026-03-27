'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SchoolAdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/school-admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          password: password.trim(),
        }),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        setError(data.message || 'Invalid credentials.')
        return
      }

      sessionStorage.setItem('school_admin_authenticated', 'true')
      sessionStorage.setItem('school_admin', JSON.stringify(data.schoolAdmin))
      router.push('/school-admin')
    } catch {
      setError('Failed to login.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-black p-4 text-white">
      <div className="mx-auto max-w-md space-y-6 pt-20">
        <h1 className="text-center text-3xl font-semibold">School Admin Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-5">
          <div>
            <label className="mb-2 block text-sm text-white/80">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm outline-none focus:border-white/40"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-white/80">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm outline-none focus:border-white/40"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-60"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
        </form>
      </div>
    </main>
  )
}
