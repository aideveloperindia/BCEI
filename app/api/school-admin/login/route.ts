import { NextRequest, NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'
import { SchoolAdminDocument } from '@/lib/school-admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password.trim() : ''

    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'username and password are required.' }, { status: 400 })
    }

    const db = await getMongoDb()
    const schoolAdmins = db.collection<SchoolAdminDocument>('school_admins')
    const account = await schoolAdmins.findOne({
      username,
      password,
      isActive: true,
    })

    if (!account) {
      return NextResponse.json({ success: false, message: 'Invalid credentials.' }, { status: 401 })
    }

    await schoolAdmins.updateOne(
      { schoolId: account.schoolId },
      { $set: { lastLoginAt: new Date(), updatedAt: new Date() } }
    )

    return NextResponse.json({
      success: true,
      schoolAdmin: {
        schoolId: account.schoolId,
        schoolName: account.schoolName,
        username: account.username,
      },
    })
  } catch (error) {
    console.error('Error logging in school admin:', error)
    return NextResponse.json({ success: false, message: 'Login failed.' }, { status: 500 })
  }
}
