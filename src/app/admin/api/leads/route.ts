import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const stage = searchParams.get('stage') || ''
    const source = searchParams.get('source') || ''

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { business: { contains: search } },
        { city: { contains: search } },
        { phone: { contains: search } },
      ]
    }
    if (stage) where.stage = stage
    if (source) where.source = source

    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, phone: true } },
          _count: { select: { contacts: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.lead.count({ where }),
    ])

    return NextResponse.json({ leads, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Admin leads error:', error)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, stage, score, notes, aiSuggestion } = body

    if (!id) return NextResponse.json({ error: 'Lead ID required' }, { status: 400 })

    const data: Record<string, unknown> = {}
    if (stage !== undefined) data.stage = stage
    if (score !== undefined) data.score = score
    if (notes !== undefined) data.notes = notes
    if (aiSuggestion !== undefined) data.aiSuggestion = aiSuggestion

    const lead = await db.lead.update({ where: { id }, data })
    return NextResponse.json({ lead })
  } catch (error) {
    console.error('Admin lead update error:', error)
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Lead ID required' }, { status: 400 })

    await db.lead.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin lead delete error:', error)
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 })
  }
}
