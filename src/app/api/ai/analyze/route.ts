import { NextResponse } from 'next/server'
import { analyzeLead } from '@/lib/ai-service'
import { db, withDbFallback } from '@/lib/db'
import { deductCredits, getEffectiveCost, grantCredits } from '@/lib/credits-service'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { leadId, userId } = body

    if (!leadId) {
      return NextResponse.json({ error: 'leadId required' }, { status: 400 })
    }

    const lead = await withDbFallback(
      (client) => (client as any).lead.findUnique({ where: { id: leadId } }),
      null as any,
    )
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // SECURITY: ownership check
    const ownerId = userId || lead.userId
    if (userId && lead.userId !== userId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // --- Credit check & deduction ---
    const costInfo = await getEffectiveCost('ai.analyze', ownerId)
    if (costInfo.cost > 0) {
      const balance = await withDbFallback(
        (client) => (client as any).user.findUnique({ where: { id: ownerId }, select: { credits: true } }),
        null as any,
      )
      if (balance && balance.credits < costInfo.cost) {
        return NextResponse.json({
          error: `Crédits insuffisants. L'analyse IA coûte ${costInfo.cost} crédit(s). Solde : ${balance.credits}.`,
          code: 'insufficient_credits',
          required: costInfo.cost,
          balance: balance.credits,
        }, { status: 402 })
      }
    }

    const idempotencyKey = `ai-analyze:${ownerId}:${leadId}:${Date.now().toString(36)}`
    const deduct = await deductCredits({
      userId: ownerId,
      action: 'ai.analyze',
      entityId: leadId,
      idempotencyKey,
      note: `Analyse IA de ${lead.name}`,
    })
    if (!deduct.ok) {
      return NextResponse.json({
        error: deduct.reason === 'insufficient' ? 'Crédits insuffisants' : 'Échec déduction crédits',
        code: deduct.reason === 'insufficient' ? 'insufficient_credits' : 'deduct_failed',
        required: deduct.cost,
      }, { status: 402 })
    }

    const daysSince = lead.lastContactAt
      ? Math.floor((Date.now() - new Date(lead.lastContactAt).getTime()) / (1000 * 60 * 60 * 24))
      : null

    let analysis
    try {
      analysis = await analyzeLead({
        leadName: lead.name,
        business: lead.business,
        sector: lead.sector,
        city: lead.city,
        contactCount: lead.contactCount,
        stage: lead.stage,
        daysSinceLastContact: daysSince,
        source: lead.source,
      })
    } catch (aiErr) {
      // Refund on AI failure
      if (deduct.cost > 0) {
        try {
          await grantCredits({
            userId: ownerId,
            amount: deduct.cost,
            action: 'system.refund',
            label: 'Remboursement IA',
            note: `Échec analyse IA pour ${lead.name}`,
          })
        } catch {}
      }
      throw aiErr
    }

    await withDbFallback(
      (client) =>
        (client as any).lead.update({
          where: { id: leadId },
          data: { score: analysis.score, aiSuggestion: analysis.suggestion },
        }),
      null as any,
    )

    return NextResponse.json({
      suggestion: analysis.suggestion,
      score: analysis.score,
      leadId,
      creditsUsed: deduct.cost,
      creditsFreeQuotaUsed: deduct.freeQuotaUsed,
      balanceAfter: deduct.balanceAfter,
    })
  } catch (error) {
    console.error('AI analyze error:', error)
    return NextResponse.json({ error: 'Failed to analyze lead' }, { status: 500 })
  }
}
