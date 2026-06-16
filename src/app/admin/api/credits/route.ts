import { NextResponse } from 'next/server'
import { db, withDbFallback } from '@/lib/db'
import { grantCredits, setCredits } from '@/lib/credits-service'

/**
 * PATCH /admin/api/credits
 * Set a user's credits to an absolute value (admin "set" mode) OR change plan.
 *
 * Body: { userId, credits?, plan? }
 *  - If `credits` is provided: sets the balance (logs a delta transaction).
 *  - If `plan` is provided: updates the plan.
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { userId, credits, plan } = body

    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    const updates: any = {}

    if (credits !== undefined) {
      if (typeof credits !== 'number' || credits < 0) {
        return NextResponse.json({ error: 'credits must be >= 0' }, { status: 400 })
      }
      const result = await setCredits({ userId, credits })
      if (!result.ok) {
        return NextResponse.json({ error: 'Failed to set credits' }, { status: 500 })
      }
      // Audit log
      await withDbFallback(
        (client) =>
          (client as any).auditLog.create({
            data: {
              action: 'update',
              entity: 'credit',
              entityId: userId,
              adminEmail: 'admin@procible.app',
              details: JSON.stringify({ action: 'set', credits }),
            },
          }),
        null as any,
      )
    }

    if (plan !== undefined) {
      if (!['free', 'starter', 'pro'].includes(plan)) {
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
      }
      updates.plan = plan
    }

    if (Object.keys(updates).length > 0) {
      await withDbFallback(
        (client) => (client as any).user.update({ where: { id: userId }, data: updates }),
        null as any,
      )
      // Audit log for plan change
      if (updates.plan) {
        await withDbFallback(
          (client) =>
            (client as any).auditLog.create({
              data: {
                action: 'update',
                entity: 'credit',
                entityId: userId,
                adminEmail: 'admin@procible.app',
                details: JSON.stringify({ action: 'plan_change', plan }),
              },
            }),
          null as any,
        )
      }
    }

    const user = await withDbFallback(
      (client) => (client as any).user.findUnique({ where: { id: userId } }),
      null as any,
    )
    return NextResponse.json({ user })
  } catch (error) {
    console.error('Admin credits update error:', error)
    return NextResponse.json({ error: 'Failed to update credits' }, { status: 500 })
  }
}

/**
 * POST /admin/api/credits
 * Grant (add or subtract) credits to a user. Logs a transaction.
 *
 * Body: { userId, amount, note?, idempotencyKey? }
 *  - amount > 0: adds credits
 *  - amount < 0: subtracts (cannot go below 0)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, amount, note, idempotencyKey } = body

    if (!userId || amount === undefined || typeof amount !== 'number') {
      return NextResponse.json({ error: 'userId and numeric amount required' }, { status: 400 })
    }
    if (amount === 0) {
      return NextResponse.json({ error: 'amount must be non-zero' }, { status: 400 })
    }

    const result = await grantCredits({
      userId,
      amount,
      action: amount > 0 ? 'admin.grant' : 'admin.deduct',
      label: amount > 0 ? 'Crédits offerts par l\'admin' : 'Crédits retirés par l\'admin',
      note: note || null,
      idempotencyKey: idempotencyKey || null,
    })

    if (!result.ok) {
      return NextResponse.json({ error: 'Failed to grant credits' }, { status: 500 })
    }

    // Audit log
    await withDbFallback(
      (client) =>
        (client as any).auditLog.create({
          data: {
            action: 'update',
            entity: 'credit',
            entityId: userId,
            adminEmail: 'admin@procible.app',
            details: JSON.stringify({ action: amount > 0 ? 'add' : 'subtract', amount, note }),
          },
        }),
      null as any,
    )

    const user = await withDbFallback(
      (client) => (client as any).user.findUnique({ where: { id: userId } }),
      null as any,
    )
    return NextResponse.json({ user, transaction: result.transaction })
  } catch (error) {
    console.error('Admin credits add error:', error)
    return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 })
  }
}
