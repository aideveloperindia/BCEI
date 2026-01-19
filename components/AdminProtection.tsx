'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface AdminProtectionProps {
  children: React.ReactNode
}

export function AdminProtection({ children }: AdminProtectionProps) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if admin is authenticated
    const checkAuth = () => {
      const authStatus = sessionStorage.getItem('admin_authenticated')
      if (authStatus === 'true') {
        setIsAuthenticated(true)
      } else {
        router.push('/admin')
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
