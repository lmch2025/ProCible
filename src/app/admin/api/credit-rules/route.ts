import { NextResponse } from 'next/server'
import { db, withDbFallback } from '@/lib/db'
import { getAllRules, ensureDefaultCreditRules, DEFAULT_CREDIT_RULES } from '@/lib/credits-service'

/**
 * GET /admin/api/credit-rules
 * Returns all credit rules. Seeds defaults if the table is empty.
 */
export async function GET() {
  try {
    await ensureDefaultCreditRules()
    const rules = await getAllRules()
    return NextResponse.json({ rules })
  } catch (error) {
    console.error('Credit rules GET error:', error)
    return NextResponse.json({ rules: [] })
  }
}

/**
 * POST /admin/api/credit-rules
 * Create a new credit rule.
 *
 * Body: { action, label, cost, description?, enabled?, freeQuotaPerDay? }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, label, cost, description, enabled, freeQuotaPerDay } = body

    if (!action || !label) {
      return NextResponse.json({ error: 'action and label required' }, { status: 400 })
    }
    if (typeof cost !== 'number' || cost < 0) {
      return NextResponse.json({ error: 'cost must be a non-negative number' }, { status: 400 })
    }

    // Check for duplicate action key
    const existing = await withDbFallback(
      (client) => (client as any).creditRule.findUnique({ where: { action } }),
      null as any,
    )
    if (existing) {
      return NextResponse.json({ error: 'Une règle avec cette action existe déjà' }, { status: 409 })
    }

    const rule = await withDbFallback(
      (client) =>
        (client as any).creditRule.create({
          data: {
            action,
            label,
            cost,
            description: description || null,
            enabled: enabled !== undefined ? !!enabled : true,
            freeQuotaPerDay: typeof freeQuotaPerDay === 'number' ? freeQuotaPerDay : 0,
          },
        }),
      null as any,
    )

    // Audit log
    await withDbFallback(
      (client) =>
        (client as any).auditLog.create({
          data: {
            action: 'create',
            entity: 'credit_rule',
            entityId: rule?.id,
            adminEmail: 'admin@procible.app',
            details: JSON.stringify({ action, label, cost }),
          },
        }),
      null as any,
    )

    return NextResponse.json({ rule })
  } catch (error) {
    console.error('Credit rule POST error:', error)
    return NextResponse.json({ error: 'Failed to create rule' }, { status: 500 })
  }
}

/**
 * PATCH /admin/api/credit-rules
 * Update an existing credit rule.
 *
 * Body: { id?, action?, label?, cost?, description?, enabled?, freeQuotaPerDay? }
 * Identify the rule by id OR action.
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, action, label, cost, description, enabled, freeQuotaPerDay } = body

    if (!id && !action) {
      return NextResponse.json({ error: 'id or action required' }, { status: 400 })
    }

    const where: any = id ? { id } : { action }
    const data: any = {}
    if (label !== undefined) data.label = label
    if (cost !== undefined) {
      if (typeof cost !== 'number' || cost < 0) {
        return NextResponse.json({ error: 'cost must be a non-negative number' }, { status: 400 })
      }
      data.cost = cost
    }
    if (description !== undefined) data.description = description
    if (enabled !== undefined) data.enabled = !!enabled
    if (freeQuotaPerDay !== undefined) {
      if (typeof freeQuotaPerDay !== 'number' || freeQuotaPerDay < 0) {
        return NextResponse.json({ error: 'freeQuotaPerDay must be a non-negative number' }, { status: 400 })
      }
      data.freeQuotaPerDay = freeQuotaPerDay
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const rule = await withDbFallback(
      (client) =>
        (client as any).creditRule.update({
          where,
          data,
        }),
      null as any,
    )

    // Audit log
    await withDbFallback(
      (client) =>
        (client as any).auditLog.create({
          data: {
            action: 'update',
            entity: 'credit_rule',
            entityId: id || action,
            adminEmail: 'admin@procible.app',
            details: JSON.stringify(data),
          },
        }),
      null as any,
    )

    return NextResponse.json({ rule })
  } catch (error) {
    console.error('Credit rule PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 })
  }
}

/**
 * DELETE /admin/api/credit-rules?id=... or ?action=...
 */
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const action = url.searchParams.get('action')

    if (!id && !action) {
      return NextResponse.json({ error: 'id or action query param required' }, { status: 400 })
    }

    const where: any = id ? { id } : { action }
    await withDbFallback(
      (client) => (client as any).creditRule.delete({ where }),
      null as any,
    )

    // Audit log
    await withDbFallback(
      (client) =>
        (client as any).auditLog.create({
          data: {
            action: 'delete',
            entity: 'credit_rule',
            entityId: id || action,
            adminEmail: 'admin@procible.app',
            details: JSON.stringify({ deleted: true }),
          },
        }),
      null as any,
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Credit rule DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 })
  }
}

// Re-export for type access in other modules
export { DEFAULT_CREDIT_RULES }
