import { NextResponse } from 'next/server'
import { db, withDbFallback } from '@/lib/db'

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { userId, credits, plan } = body

    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    const data: Record<string, unknown> = {}
    if (credits !== undefined) data.credits = credits
    if (plan !== undefined) data.plan = plan

    const user = await withDbFallback(
      (client) => client.user.update({ where: { id: userId }, data }),
      null as any,
    )
    return NextResponse.json({ user })
  } catch (error) {
    console.error('Admin credits update error:', error)
    return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, amount } = body

    if (!userId || amount === undefined) return NextResponse.json({ error: 'User ID and amount required' }, { status: 400 })

    const user = await withDbFallback(
      (client) =>
        client.user.update({
          where: { id: userId },
          data: { credits: { increment: amount } },
        }),
      null as any,
    )
    return NextResponse.json({ user })
  } catch (error) {
    console.error('Admin credits add error:', error)
    return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 })
  }
}
