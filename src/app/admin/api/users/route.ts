import { NextResponse } from 'next/server'
import { db, withDbFallback } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const plan = searchParams.get('plan') || ''

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ]
    }
    if (plan) where.plan = plan

    const [users, total] = await withDbFallback(
      async (client) =>
        Promise.all([
          client.user.findMany({
            where,
            include: {
              _count: { select: { leads: true, notifications: true, campaigns: true } },
              preferences: true,
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
          }),
          client.user.count({ where }),
        ]),
      [[], 0],
    )

    return NextResponse.json({ users, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json({ users: [], total: 0, page: 1, limit: 20, totalPages: 0 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, plan, credits, name, onboarded } = body

    if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    const data: Record<string, unknown> = {}
    if (plan !== undefined) data.plan = plan
    if (credits !== undefined) data.credits = credits
    if (name !== undefined) data.name = name
    if (onboarded !== undefined) data.onboarded = onboarded

    const user = await withDbFallback(
      (client) => client.user.update({ where: { id }, data }),
      null as any,
    )
    return NextResponse.json({ user })
  } catch (error) {
    console.error('Admin user update error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    await withDbFallback(
      (client) => client.user.delete({ where: { id } }),
      null as any,
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin user delete error:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
