import { NextResponse } from 'next/server'
import { generateMessageDraft } from '@/lib/ai-service'
import { db, withDbFallback } from '@/lib/db'
import { deductCredits, getEffectiveCost, grantCredits } from '@/lib/credits-service'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { leadId, channel, userId } = body

    if (!leadId || !channel) {
      return NextResponse.json({ error: 'leadId and channel required' }, { status: 400 })
    }

    // Resolve the lead and verify ownership if userId is provided.
    const lead = await withDbFallback(
      (client) => (client as any).lead.findUnique({ where: { id: leadId } }),
      null as any,
    )
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // SECURITY: if userId is provided, ensure the lead belongs to that user.
    // (If userId is not provided, we default to the lead's owner.)
    const ownerId = userId || lead.userId
    if (userId && lead.userId !== userId) {
      return NextResponse.json({ error: 'Accès refusé : ce lead n\'appartient pas à cet utilisateur' }, { status: 403 })
    }

    // --- Credit check & deduction ---
    const costInfo = await getEffectiveCost('ai.draft', ownerId)
    if (costInfo.cost > 0) {
      const balance = await withDbFallback(
        (client) => (client as any).user.findUnique({ where: { id: ownerId }, select: { credits: true } }),
        null as any,
      )
      if (balance && balance.credits < costInfo.cost) {
        return NextResponse.json({
          error: `Crédits insuffisants. Génération d'un message IA coûte ${costInfo.cost} crédit(s). Solde : ${balance.credits}.`,
          code: 'insufficient_credits',
          required: costInfo.cost,
          balance: balance.credits,
        }, { status: 402 })
      }
    }

    const idempotencyKey = `ai-draft:${ownerId}:${leadId}:${channel}:${Date.now().toString(36)}`
    const deduct = await deductCredits({
      userId: ownerId,
      action: 'ai.draft',
      entityId: leadId,
      idempotencyKey,
      note: `Message ${channel} pour ${lead.name}`,
    })
    if (!deduct.ok) {
      return NextResponse.json({
        error: deduct.reason === 'insufficient' ? 'Crédits insuffisants' : 'Échec déduction crédits',
        code: deduct.reason === 'insufficient' ? 'insufficient_credits' : 'deduct_failed',
        required: deduct.cost,
      }, { status: 402 })
    }

    const lastContact = await withDbFallback(
      (client) =>
        (client as any).contactHistory.findFirst({
          where: { leadId },
          orderBy: { createdAt: 'desc' },
        }),
      null as any,
    )

    let result
    try {
      result = await generateMessageDraft({
        leadName: lead.name,
        business: lead.business,
        sector: lead.sector,
        city: lead.city,
        contactCount: lead.contactCount,
        lastContactType: lastContact?.type || null,
        lastContactDate: lastContact?.createdAt?.toISOString?.() || null,
        stage: lead.stage,
        channel,
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
            note: `Échec génération message ${channel}`,
          })
        } catch {}
      }
      throw aiErr
    }

    await withDbFallback(
      (client) =>
        (client as any).lead.update({
          where: { id: leadId },
          data: { aiSuggestion: result.content.substring(0, 500) },
        }),
      null as any,
    )

    return NextResponse.json({
      draft: result.content,
      model: result.modelName,
      leadId,
      creditsUsed: deduct.cost,
      creditsFreeQuotaUsed: deduct.freeQuotaUsed,
      balanceAfter: deduct.balanceAfter,
    })
  } catch (error) {
    console.error('AI draft error:', error)
    return NextResponse.json({ error: 'Failed to generate draft' }, { status: 500 })
  }
}
