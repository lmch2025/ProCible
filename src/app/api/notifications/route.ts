import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/notifications
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      const notifications = await db.notification.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
      return NextResponse.json(notifications)
    }

    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(notifications)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

// PATCH /api/notifications - Mark as read
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Notification ID required' }, { status: 400 })
    }

    const notification = await db.notification.update({
      where: { id },
      data: { read: true },
    })

    return NextResponse.json(notification)
  } catch {
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}
