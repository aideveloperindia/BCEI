import { NextRequest, NextResponse } from 'next/server'
import { getMessaging } from '@/lib/firebase-admin'
import { getClientConfig } from '@/config/client-firebase-map'

export const dynamic = 'force-dynamic'

/** Warms serverless + Firebase Admin so the first Send in admin is faster. */
export async function GET(request: NextRequest) {
  try {
    const host = request.headers.get('host') || ''
    const domain = host.split(':')[0]
    const config = getClientConfig(domain)
    if (!config) return NextResponse.json({ ok: true })
    getMessaging(domain)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
