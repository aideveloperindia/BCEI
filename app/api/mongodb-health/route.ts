import { NextResponse } from 'next/server'
import { pingMongo } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const ok = await pingMongo()
    return NextResponse.json({ success: ok, message: ok ? 'MongoDB connected' : 'MongoDB ping failed' })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'MongoDB connection failed',
      },
      { status: 500 }
    )
  }
}
