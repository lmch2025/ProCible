import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const settings = await db.appSettings.findMany({ orderBy: { key: 'asc' } })
    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Admin settings error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { key, value, description } = body

    if (!key || value === undefined) return NextResponse.json({ error: 'Key and value required' }, { status: 400 })

    const setting = await db.appSettings.upsert({
      where: { key },
      update: { value, description: description || undefined },
      create: { key, value, description: description || null },
    })
    return NextResponse.json({ setting })
  } catch (error) {
    console.error('Admin settings update error:', error)
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 })
  }
}
