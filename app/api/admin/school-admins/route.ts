import { NextRequest, NextResponse } from 'next/server'
import { getMongoDb } from '@/lib/mongodb'
import { SchoolAdminDocument, generateSchoolAdminCredentials } from '@/lib/school-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = await getMongoDb()
    const schools = await db
      .collection<SchoolAdminDocument>('school_admins')
      .find({})
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({
      success: true,
      schoolAdmins: schools.map((school) => ({
        schoolId: school.schoolId,
        schoolName: school.schoolName,
        username: school.username,
        password: school.password,
        isActive: school.isActive,
        createdAt: school.createdAt,
        lastLoginAt: school.lastLoginAt || null,
      })),
    })
  } catch (error) {
    console.error('Error fetching school admins:', error)
    return NextResponse.json({ success: false, message: 'Failed to fetch school admins.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const schoolName = typeof body.schoolName === 'string' ? body.schoolName.trim() : ''

    if (!schoolName) {
      return NextResponse.json({ success: false, message: 'schoolName is required.' }, { status: 400 })
    }

    const db = await getMongoDb()
    const schoolAdmins = db.collection<SchoolAdminDocument>('school_admins')

    const existing = await schoolAdmins.findOne({
      schoolName: { $regex: `^${schoolName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
      isActive: true,
    })

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Active school admin already exists for this school.' },
        { status: 409 }
      )
    }

    const creds = generateSchoolAdminCredentials(schoolName)
    const now = new Date()
    const schoolAdmin: SchoolAdminDocument = {
      schoolId: creds.schoolId,
      schoolName,
      username: creds.username,
      password: creds.password,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }

    await schoolAdmins.insertOne(schoolAdmin)

    return NextResponse.json({
      success: true,
      message: 'School admin created successfully.',
      schoolAdmin: {
        schoolId: schoolAdmin.schoolId,
        schoolName: schoolAdmin.schoolName,
        username: schoolAdmin.username,
        password: schoolAdmin.password,
        isActive: schoolAdmin.isActive,
        createdAt: schoolAdmin.createdAt,
      },
    })
  } catch (error) {
    console.error('Error creating school admin:', error)
    return NextResponse.json({ success: false, message: 'Failed to create school admin.' }, { status: 500 })
  }
}
