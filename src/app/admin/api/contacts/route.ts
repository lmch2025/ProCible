import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('leadId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '30')

    const where: Record<string, unknown> = {}
    if (leadId) where.leadId = leadId

    const [contacts, total] = await Promise.all([
      db.contactHistory.findMany({
        where,
        include: {
          lead: { select: { id: true, name: true, business: true, stage: true, user: { select: { id: true, name: true, phone: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.contactHistory.count({ where }),
    ])

    return NextResponse.json({ contacts, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Admin contacts error:', error)
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Contact ID required' }, { status: 400 })

    await db.contactHistory.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin contact delete error:', error)
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 })
  }
}
