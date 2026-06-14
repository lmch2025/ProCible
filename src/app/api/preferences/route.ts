import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/preferences
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ sectors: '', cities: '', businessType: '' })
    }

    const preference = await db.preference.findUnique({
      where: { userId },
    })

    return NextResponse.json(preference || { sectors: '', cities: '', businessType: '' })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
  }
}

// POST /api/preferences - Create or update
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, sectors, cities, businessType } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const preference = await db.preference.upsert({
      where: { userId },
      update: { sectors, cities, businessType },
      create: { userId, sectors, cities, businessType },
    })

    return NextResponse.json(preference)
  } catch {
    return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
  }
}
