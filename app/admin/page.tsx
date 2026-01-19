'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function AdminLogin() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (data.success) {
        sessionStorage.setItem('admin_authenticated', 'true')
        router.push('/admin/push-notifications')
      } else {
        setError(data.message || 'Invalid password')
      }
    } catch (err) {
      setError('Failed to authenticate')
      console.error('Login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center justify-center space-y-8 max-w-md w-full">
        {/* Logo - light circle so dark logo is visible on black background */}
        <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center p-2 shadow-lg ring-2 ring-white/20">
          <Image
            src="/advocates-logo.png"
            alt="Advocates Logo"
            width={96}
            height={96}
            className="object-contain w-full h-full"
            priority
            unoptimized
          />
        </div>

        {/* Login Form */}
        <div className="w-full space-y-4">
          <h1 className="text-white text-2xl font-semibold text-center">
            Admin Login
          </h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full bg-white/10 text-white placeholder-white/50 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:border-white/40"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black font-semibold py-3 px-8 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          {error && (
            <div className="text-red-400 text-sm text-center">{error}</div>
          )}
        </div>
      </div>
    </main>
  )
}
