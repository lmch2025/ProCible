import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type') || ''
    const unreadOnly = searchParams.get('unread') === 'true'

    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (unreadOnly) where.read = false

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where,
        include: { user: { select: { id: true, name: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.notification.count({ where }),
    ])

    return NextResponse.json({ notifications, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Admin notifications error:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, type, title, message } = body

    if (!userId || !title || !message) return NextResponse.json({ error: 'userId, title, message required' }, { status: 400 })

    const notification = await db.notification.create({
      data: { userId, type: type || 'system', title, message },
    })
    return NextResponse.json({ notification })
  } catch (error) {
    console.error('Admin notification create error:', error)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, markAllRead } = body

    if (markAllRead) {
      await db.notification.updateMany({ where: { read: false }, data: { read: true } })
      return NextResponse.json({ success: true })
    }

    if (!id) return NextResponse.json({ error: 'Notification ID required' }, { status: 400 })
    const notification = await db.notification.update({ where: { id }, data: { read: true } })
    return NextResponse.json({ notification })
  } catch (error) {
    console.error('Admin notification update error:', error)
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Notification ID required' }, { status: 400 })

    await db.notification.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin notification delete error:', error)
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
  }
}
