'use client'

import Link from 'next/link'
import { Bell, Newspaper, Sparkles } from 'lucide-react'

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'How It Works', href: '/admission/start' },
  { label: 'Benefits', href: '/admission/benefits' },
  { label: 'Contact', href: '/admin' },
]

export function SiteNavbar() {
  return (
    <header className="fixed top-0 z-50 w-full px-6 py-4 md:px-14">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="relative flex h-7 w-7 items-center justify-center rounded-full border-2 border-foreground/60">
            <span className="h-3 w-3 rounded-full border border-foreground/60" />
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
          {[Bell, Newspaper, Sparkles].map((Icon, index) => (
            <button
              key={index}
              type="button"
              className="liquid-glass flex h-10 w-10 items-center justify-center rounded-full"
              aria-label="social icon"
            >
              <Icon className="h-4 w-4 text-white/80" />
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
