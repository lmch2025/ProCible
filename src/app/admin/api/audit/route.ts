import { NextResponse } from 'next/server'
import { db, withDbFallback } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '30')
    const action = searchParams.get('action') || ''
    const entity = searchParams.get('entity') || ''

    const where: Record<string, unknown> = {}
    if (action) where.action = action
    if (entity) where.entity = entity

    const [logs, total] = await withDbFallback(
      async (client) =>
        Promise.all([
          client.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
          }),
          client.auditLog.count({ where }),
        ]),
      [[], 0],
    )

    return NextResponse.json({ logs, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Admin audit error:', error)
    return NextResponse.json({ logs: [], total: 0, page: 1, limit: 30, totalPages: 0 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, entity, entityId, adminEmail, details, ip } = body

    if (!action || !entity || !adminEmail) {
      return NextResponse.json({ error: 'action, entity, adminEmail required' }, { status: 400 })
    }

    const log = await withDbFallback(
      (client) =>
        client.auditLog.create({
          data: {
            action,
            entity,
            entityId: entityId || null,
            adminEmail,
            details: details ? JSON.stringify(details) : null,
            ip: ip || null,
          },
        }),
      null as any,
    )

    return NextResponse.json({ log })
  } catch (error) {
    console.error('Admin audit create error:', error)
    return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 })
  }
}
