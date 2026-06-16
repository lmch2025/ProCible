import { NextResponse } from 'next/server'
import { db, withDbFallback } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || ''

    const where: Record<string, unknown> = {}
    if (status) where.status = status

    const [campaigns, total] = await withDbFallback(
      async (client) =>
        Promise.all([
          client.prospectionCampaign.findMany({
            where,
            include: { user: { select: { id: true, name: true, phone: true } } },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
          }),
          client.prospectionCampaign.count({ where }),
        ]),
      [[], 0],
    )

    return NextResponse.json({ campaigns, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Admin campaigns error:', error)
    return NextResponse.json({ campaigns: [], total: 0, page: 1, limit: 20, totalPages: 0 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, status, leadsFound } = body

    if (!id) return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 })

    const data: Record<string, unknown> = {}
    if (status !== undefined) data.status = status
    if (leadsFound !== undefined) data.leadsFound = leadsFound

    const campaign = await withDbFallback(
      (client) => client.prospectionCampaign.update({ where: { id }, data }),
      null as any,
    )
    return NextResponse.json({ campaign })
  } catch (error) {
    console.error('Admin campaign update error:', error)
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 })

    await withDbFallback(
      (client) => client.prospectionCampaign.delete({ where: { id } }),
      null as any,
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin campaign delete error:', error)
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 })
  }
}
