'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface SchoolAdminProtectionProps {
  children: React.ReactNode
}

export function SchoolAdminProtection({ children }: SchoolAdminProtectionProps) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const auth = sessionStorage.getItem('school_admin_authenticated')
    if (auth === 'true') {
      setReady(true)
      return
    }
    router.replace('/school-admin/login')
  }, [router])

  if (!ready) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading...
      </div>
    )
  }

  return <>{children}</>
}
