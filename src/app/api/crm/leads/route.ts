import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stage = searchParams.get('stage')
    const userId = searchParams.get('userId')

    const where: Record<string, unknown> = {}
    if (stage && stage !== 'all') where.stage = stage
    if (userId) where.userId = userId

    const leads = await db.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        contacts: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      take: 50,
    })

    return NextResponse.json(leads)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, stage, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'Lead ID required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (stage) updateData.stage = stage
    if (notes !== undefined) updateData.notes = notes

    const lead = await db.lead.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(lead)
  } catch {
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }
}
