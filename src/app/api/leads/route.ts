import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/leads - Fetch leads for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      const leads = await db.lead.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
      return NextResponse.json(leads)
    }

    const leads = await db.lead.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(leads)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}

// POST /api/leads - Create a new lead
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const lead = await db.lead.create({
      data: {
        name: body.name,
        business: body.business || null,
        sector: body.sector || null,
        city: body.city || null,
        phone: body.phone || null,
        whatsapp: body.whatsapp || null,
        email: body.email || null,
        address: body.address || null,
        source: body.source || 'maps',
        status: body.status || 'new',
        notes: body.notes || null,
        userId: body.userId,
      },
    })

    return NextResponse.json(lead, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }
}

// PATCH /api/leads - Update a lead
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'Lead ID required' }, { status: 400 })
    }

    const lead = await db.lead.update({
      where: { id },
      data,
    })

    return NextResponse.json(lead)
  } catch {
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }
}
