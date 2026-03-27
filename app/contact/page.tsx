'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { SiteNavbar } from '@/components/site/SiteNavbar'

type ContactIntent = {
  key: string
  label: string
}

type ContactPerson = {
  id: string
  name: string
  phone: string
}

const intents: ContactIntent[] = [
  { key: 'complaint', label: 'Complaint' },
  { key: 'technical_issue', label: 'Technical issue' },
  { key: 'urgent_admission_need', label: 'Urgent admission need' },
  { key: 'know_more', label: 'Know more about the platform' },
  { key: 'casual_contact', label: 'Casual contact' },
]

const contacts: ContactPerson[] = [
  { id: 'aditya', name: 'Aditya', phone: '+919505009699' },
  { id: 'rajesh', name: 'Rajesh', phone: '+919966888856' },
]

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, '')
}

function buildWhatsappMessage(person: ContactPerson, intent: ContactIntent): string {
  return [
    `Hello ${person.name},`,
    '',
    'I am contacting from Any School Fee Discount.',
    `Intent: ${intent.label}`,
    '',
    'Please help me with the next steps as soon as possible.',
  ].join('\n')
}

export default function ContactPage() {
  const [activePerson, setActivePerson] = useState<ContactPerson | null>(null)

  const startWhatsappFlow = (person: ContactPerson) => {
    setActivePerson(person)
  }

  const sendWhatsapp = (person: ContactPerson, intent: ContactIntent) => {
    const phone = normalizePhone(person.phone)
    const text = encodeURIComponent(buildWhatsappMessage(person, intent))
    const url = `https://wa.me/${phone}?text=${text}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setActivePerson(null)
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteNavbar />

      <section className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-4 pb-16 pt-28 md:pt-32">
        <div className="space-y-3 text-center">
          <h1 className="text-4xl font-medium tracking-[-1px] md:text-5xl">Contact Support</h1>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-base">
            Get the best possible school fee discount - we negotiate with schools on your behalf. Choose a
            person and start WhatsApp with a prefilled message after selecting your intent.
          </p>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground md:text-base">
            For parents changing schools: we help with new admission and fee discount support.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {contacts.map((person) => (
            <div key={person.id} className="liquid-glass rounded-2xl p-6">
              <p className="text-2xl font-semibold">{person.name}</p>
              <p className="mt-1 text-sm text-white/75">{person.phone}</p>
              <button
                type="button"
                onClick={() => startWhatsappFlow(person)}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background transition hover:scale-[1.02]"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </button>
            </div>
          ))}
        </div>

        {activePerson ? (
          <div className="mt-8 rounded-2xl border border-border/40 bg-card/60 p-5">
            <p className="text-sm text-muted-foreground">Selected: {activePerson.name}</p>
            <h2 className="mt-1 text-xl font-semibold">Choose message intent</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {intents.map((intent) => (
                <button
                  key={intent.key}
                  type="button"
                  onClick={() => sendWhatsapp(activePerson, intent)}
                  className="rounded-lg border border-border/50 bg-background/70 px-4 py-3 text-left text-sm transition hover:border-foreground/40 hover:bg-background"
                >
                  {intent.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setActivePerson(null)}
              className="mt-4 text-sm text-muted-foreground underline hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        ) : null}

        <div className="mt-10 text-center text-sm text-muted-foreground">
          Need admissions process details first? <Link href="/admission/start" className="underline">Start here</Link>.
        </div>
      </section>
    </main>
  )
}
