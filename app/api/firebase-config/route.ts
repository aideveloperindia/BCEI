import { NextRequest, NextResponse } from 'next/server'
import { getClientConfig } from '@/config/client-firebase-map'

export async function GET(request: NextRequest) {
  try {
    // Get domain from request headers
    const host = request.headers.get('host') || ''
    const domain = host.split(':')[0]

    // Get client config
    const config = getClientConfig(domain)
    if (!config) {
      return NextResponse.json(
        { success: false, message: `No config found for domain: ${domain}` },
        { status: 400 }
      )
    }

    // Return public Firebase config (safe to expose)
    return NextResponse.json({
      success: true,
      config: {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
        projectId: config.projectId,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '',
      },
    })
  } catch (error) {
    console.error('Error getting Firebase config:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get config',
      },
      { status: 500 }
    )
  }
}
