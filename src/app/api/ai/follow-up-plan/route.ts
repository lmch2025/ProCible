import { NextResponse } from 'next/server'
import { db, withDbFallback } from '@/lib/db'
import { deductCredits, getEffectiveCost, grantCredits } from '@/lib/credits-service'
import { generateFollowUpPlan, type FollowUpPlan } from '@/lib/ai-service'

/**
 * POST /api/ai/follow-up-plan
 * Body: { leadId: string, userId?: string }
 *
 * Generates a hierarchical follow-up plan for a single lead:
 *   - 4-5 stages with dayOffset (J+1, J+3, J+7, J+14, J+30)
 *   - Each stage: channel, objective, ready-to-send script, tactical tips
 *   - Strategy summary
 *
 * Side effects:
 *   - Charges `ai.follow_up_plan` credits (3 credits, 1 free/day)
 *   - Stores the plan as JSON in `Lead.aiSuggestion` (prefixed with a marker
 *     so the UI can detect "this is a plan, not a plain suggestion")
 *   - Schedules one Notification per upcoming stage (the next 3 stages)
 *   - Updates `Lead.nextFollowUpAt` to the next pending stage's date
 *   - Logs a CreditTransaction (audit trail)
 *
 * On AI failure, credits are refunded.
 */

const PLAN_MARKER = '__FOLLOW_UP_PLAN__'

/** Helper for safe refund. */
async function grantCreditsSafe(userId: string, amount: number, note: string) {
  try {
    await grantCredits({ userId, amount, action: 'system.refund', label: 'Remboursement de crédits', note })
  } catch (e) {
    console.error('Refund failed:', e)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { leadId, userId } = body

    if (!leadId) {
      return NextResponse.json({ error: 'leadId requis' }, { status: 400 })
    }

    // Load the lead + its owner's product (most recent campaign productName).
    const lead = await withDbFallback(
      (client) => (client as any).lead.findUnique({ where: { id: leadId } }),
      null as any,
    )
    if (!lead) {
      return NextResponse.json({ error: 'Lead introuvable' }, { status: 404 })
    }

    // SECURITY: ownership check.
    const ownerId = userId || lead.userId
    if (userId && lead.userId !== userId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Find the user's most recent campaign productName (for personalization).
    const lastCampaign = await withDbFallback(
      (client) =>
        (client as any).prospectionCampaign.findFirst({
          where: { userId: ownerId },
          orderBy: { createdAt: 'desc' },
          select: { productName: true },
        }),
      null as any,
    )

    // --- Credit check & deduction ---
    const costInfo = await getEffectiveCost('ai.follow_up_plan', ownerId)
    if (costInfo.cost > 0) {
      const balance = await withDbFallback(
        (client) => (client as any).user.findUnique({ where: { id: ownerId }, select: { credits: true } }),
        null as any,
      )
      if (balance && balance.credits < costInfo.cost) {
        return NextResponse.json({
          error: `Crédits insuffisants. Le plan de suivi IA coûte ${costInfo.cost} crédit(s). Solde : ${balance.credits}.`,
          code: 'insufficient_credits',
          required: costInfo.cost,
          balance: balance.credits,
        }, { status: 402 })
      }
    }

    const idempotencyKey = `ai-follow-up-plan:${ownerId}:${leadId}:${Date.now().toString(36)}`
    const deduct = await deductCredits({
      userId: ownerId,
      action: 'ai.follow_up_plan',
      entityId: leadId,
      idempotencyKey,
      note: `Plan de suivi IA pour ${lead.name}`,
    })
    if (!deduct.ok) {
      return NextResponse.json({
        error: deduct.reason === 'insufficient' ? 'Crédits insuffisants' : 'Échec déduction crédits',
        code: deduct.reason === 'insufficient' ? 'insufficient_credits' : 'deduct_failed',
        required: deduct.cost,
      }, { status: 402 })
    }

    // --- Generate the plan via AI ---
    let plan: FollowUpPlan
    try {
      plan = await generateFollowUpPlan({
        leadName: lead.name,
        business: lead.business,
        sector: lead.sector,
        city: lead.city,
        stage: lead.stage,
        contactCount: lead.contactCount,
        source: lead.source,
        productName: lastCampaign?.productName || null,
      })
    } catch (aiErr) {
      // Refund on AI failure.
      if (deduct.cost > 0) {
        await grantCreditsSafe(ownerId, deduct.cost, `Remboursement : échec génération plan IA pour ${lead.name}`)
      }
      console.error('Follow-up plan AI error:', aiErr)
      return NextResponse.json(
        { error: 'Échec de la génération du plan IA. Veuillez réessayer.' },
        { status: 502 },
      )
    }

    plan.leadId = leadId

    // --- Persist the plan in Lead.aiSuggestion (overload with marker) ---
    // Format: `__FOLLOW_UP_PLAN__<json>` so the UI can detect & parse it.
    const planJson = JSON.stringify(plan)
    await withDbFallback(
      (client) => (client as any).lead.update({
        where: { id: leadId },
        data: {
          aiSuggestion: `${PLAN_MARKER}${planJson}`,
        },
      }),
      null as any,
    )

    // --- Schedule intelligent notifications for the next 3 upcoming stages ---
    // For each of the next 3 stages (starting from the soonest future date),
    // create a notification with type 'follow_up' so the user is reminded
    // to execute that stage's action.
    const now = new Date()
    const leadCreated = lead.createdAt ? new Date(lead.createdAt) : now
    const upcomingStages = plan.stages
      .map((s) => ({ stage: s, fireAt: new Date(leadCreated.getTime() + s.dayOffset * 24 * 60 * 60 * 1000) }))
      .filter((x) => x.fireAt > now)
      .slice(0, 3)

    for (const { stage, fireAt } of upcomingStages) {
      await withDbFallback(
        (client) => (client as any).notification.create({
          data: {
            userId: ownerId,
            type: 'follow_up',
            title: `Suivi ${lead.name} — ${stage.objective}`,
            message: `Étape ${stage.step} · Canal: ${stage.channel}. Script prêt dans l'app. Cliquez pour ouvrir le lead.`,
            read: false,
            leadId,
            createdAt: fireAt, // scheduled — used by the notification system
          },
        }),
        null as any,
      )
    }

    // --- Update lead.nextFollowUpAt to the next pending stage's fire date ---
    if (upcomingStages.length > 0) {
      await withDbFallback(
        (client) => (client as any).lead.update({
          where: { id: leadId },
          data: { nextFollowUpAt: upcomingStages[0].fireAt },
        }),
        null as any,
      )
    }

    return NextResponse.json({
      plan,
      creditsUsed: deduct.cost,
      creditsFreeQuotaUsed: deduct.freeQuotaUsed,
      balanceAfter: deduct.balanceAfter,
      scheduledNotifications: upcomingStages.length,
    })
  } catch (error) {
    console.error('Follow-up plan error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la génération du plan' },
      { status: 500 },
    )
  }
}

/**
 * GET /api/ai/follow-up-plan?leadId=...
 * Returns the stored follow-up plan for a lead (if any).
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const leadId = url.searchParams.get('leadId')
    if (!leadId) {
      return NextResponse.json({ error: 'leadId requis' }, { status: 400 })
    }

    const lead = await withDbFallback(
      (client) => (client as any).lead.findUnique({
        where: { id: leadId },
        select: { id: true, name: true, aiSuggestion: true, nextFollowUpAt: true },
      }),
      null as any,
    )
    if (!lead) {
      return NextResponse.json({ error: 'Lead introuvable' }, { status: 404 })
    }

    if (!lead.aiSuggestion || !lead.aiSuggestion.startsWith(PLAN_MARKER)) {
      return NextResponse.json({ hasPlan: false, plan: null })
    }

    try {
      const json = lead.aiSuggestion.slice(PLAN_MARKER.length)
      const plan = JSON.parse(json) as FollowUpPlan
      return NextResponse.json({
        hasPlan: true,
        plan,
        nextFollowUpAt: lead.nextFollowUpAt,
      })
    } catch {
      return NextResponse.json({ hasPlan: false, plan: null })
    }
  } catch (error) {
    console.error('Follow-up plan GET error:', error)
    return NextResponse.json({ hasPlan: false, plan: null })
  }
}
