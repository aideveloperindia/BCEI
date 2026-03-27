'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Bell, Newspaper, Sparkles } from 'lucide-react'

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'How It Works', href: '/admission/start' },
  { label: 'Benefits', href: '/admission/benefits' },
  { label: 'Contact', href: '/contact' },
]

export function SiteNavbar() {
  const quickActions = [
    { Icon: Bell, href: '/admission/start', label: 'Start admission flow' },
    { Icon: Newspaper, href: '/#latest-updates', label: 'View latest updates' },
    { Icon: Sparkles, href: '/contact', label: 'Contact support' },
  ]

  return (
    <header className="fixed top-0 z-50 w-full px-6 py-4 md:px-14">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2" aria-label="Any School Fee Discount home">
          <span className="relative h-8 w-8 overflow-hidden rounded-full border border-white/20 bg-white">
            <Image src="/logo.png" alt="Any School Fee Discount Logo" fill className="object-cover" unoptimized />
          </span>
          <span className="text-sm font-bold tracking-wide">Any School Benefits</span>
        </Link>

        <nav className="hidden items-center gap-2 text-sm md:flex">
          {navItems.map((item, index) => (
            <div key={item.label} className="flex items-center gap-2">
              <Link href={item.href} className="text-muted-foreground transition hover:text-foreground">
                {item.label}
              </Link>
              {index < navItems.length - 1 ? <span className="text-muted-foreground">•</span> : null}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {quickActions.map(({ Icon, href, label }) => (
            <Link
              key={label}
              href={href}
              className="liquid-glass flex h-10 w-10 items-center justify-center rounded-full"
              aria-label={label}
              title={label}
            >
              <Icon className="h-4 w-4 text-white/80" />
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}
