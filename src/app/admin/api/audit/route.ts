import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.auditLog.count({ where }),
    ])

    return NextResponse.json({ logs, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Admin audit error:', error)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, entity, entityId, adminEmail, details, ip } = body

    if (!action || !entity || !adminEmail) {
      return NextResponse.json({ error: 'action, entity, adminEmail required' }, { status: 400 })
    }

    const log = await db.auditLog.create({
      data: {
        action,
        entity,
        entityId: entityId || null,
        adminEmail,
        details: details ? JSON.stringify(details) : null,
        ip: ip || null,
      },
    })

    return NextResponse.json({ log })
  } catch (error) {
    console.error('Admin audit create error:', error)
    return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 })
  }
}
