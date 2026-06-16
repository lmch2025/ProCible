import { NextResponse } from 'next/server'
import { withDbFallback } from '@/lib/db'

/**
 * GET /admin/api/follow-up-plans
 *
 * Lists every lead that has an AI-generated follow-up plan stored in
 * `Lead.aiSuggestion` (encoded as `__FOLLOW_UP_PLAN__<json>`).
 *
 * Returns an array of plans, each with:
 *   - leadId, leadName, leadBusiness, leadCity, leadStage, leadScore
 *   - userPhone, userName
 *   - plan: { strategy, stages: [{step, dayOffset, channel, objective, script, tips}], model, createdAt }
 *   - nextFollowUpAt
 *   - createdAt (lead creation)
 *
 * Query params:
 *   - search: filter by lead name, business, city, or user phone
 *   - model: filter by AI model id (e.g. "nvidia/nemotron-3-ultra-550b-a55b:free")
 *   - stage: filter by lead stage
 *   - page, limit: pagination
 */

const PLAN_MARKER = '__FOLLOW_UP_PLAN__'

interface ParsedPlan {
  leadId: string
  stages: Array<{
    step: number
    dayOffset: number
    channel: string
    objective: string
    script: string
    tips: string[]
  }>
  strategy: string
  model: string
  createdAt: string
}

function parsePlan(raw: string | null | undefined): ParsedPlan | null {
  if (!raw || !raw.startsWith(PLAN_MARKER)) return null
  try {
    return JSON.parse(raw.slice(PLAN_MARKER.length)) as ParsedPlan
  } catch {
    return null
  }
}

/** Map a model id to a short display name (mirrors ai-service.ts). */
function modelName(modelId: string): string {
  const map: Record<string, string> = {
    'nvidia/nemotron-3-ultra-550b-a55b:free': 'Nemotron 3 Ultra 550B',
    'openai/gpt-oss-120b:free': 'GPT-OSS 120B',
    'openai/gpt-oss-20b:free': 'GPT-OSS 20B',
    'google/gemma-4-31b-it:free': 'Gemma 4 31B',
    'google/gemma-4-26b-a4b-it:free': 'Gemma 4 26B',
    'qwen/qwen3-next-80b-a3b-instruct:free': 'Qwen3 Next 80B',
    'nousresearch/hermes-3-llama-3.1-405b:free': 'Hermes 3 405B',
    'local-fallback': 'Fallback Local',
  }
  return map[modelId] || modelId
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const modelFilter = searchParams.get('model') || ''
    const stageFilter = searchParams.get('stage') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Pull all leads with non-null aiSuggestion — we'll filter client-side
    // because SQLite's contains() doesn't help with the marker prefix check.
    const where: Record<string, unknown> = {}
    if (stageFilter) where.stage = stageFilter
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { business: { contains: search } },
        { city: { contains: search } },
      ]
    }

    const rawLeads = await withDbFallback(
      (client) =>
        (client as any).lead.findMany({
          where,
          include: {
            user: { select: { id: true, name: true, phone: true } },
          },
          orderBy: { updatedAt: 'desc' },
          take: 500, // safety cap
        }),
      [] as any[],
    )

    // Filter to only those with a parseable plan, then optionally filter by model.
    const withPlans: Array<{
      leadId: string
      leadName: string
      leadBusiness: string | null
      leadCity: string | null
      leadStage: string
      leadScore: number
      leadContactCount: number
      leadCreatedAt: string
      leadNextFollowUpAt: string | null
      userPhone: string | null
      userName: string | null
      plan: ParsedPlan
      modelDisplay: string
    }> = []

    for (const lead of rawLeads) {
      const plan = parsePlan(lead.aiSuggestion)
      if (!plan) continue
      if (modelFilter && plan.model !== modelFilter) continue
      withPlans.push({
        leadId: lead.id,
        leadName: lead.name,
        leadBusiness: lead.business || null,
        leadCity: lead.city || null,
        leadStage: lead.stage,
        leadScore: lead.score ?? 0,
        leadContactCount: lead.contactCount ?? 0,
        leadCreatedAt: lead.createdAt?.toISOString?.() || String(lead.createdAt),
        leadNextFollowUpAt: lead.nextFollowUpAt?.toISOString?.() || null,
        userPhone: lead.user?.phone || null,
        userName: lead.user?.name || null,
        plan,
        modelDisplay: modelName(plan.model),
      })
    }

    // Sort by plan.createdAt desc (most recently generated first).
    withPlans.sort(
      (a, b) => new Date(b.plan.createdAt).getTime() - new Date(a.plan.createdAt).getTime(),
    )

    const total = withPlans.length
    const start = (page - 1) * limit
    const pageItems = withPlans.slice(start, start + limit)

    // Aggregate model usage stats for the UI header.
    const modelStats: Record<string, { count: number; display: string }> = {}
    for (const item of withPlans) {
      const key = item.plan.model
      if (!modelStats[key]) {
        modelStats[key] = { count: 0, display: item.modelDisplay }
      }
      modelStats[key].count++
    }

    return NextResponse.json({
      plans: pageItems,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      modelStats: Object.entries(modelStats).map(([id, v]) => ({
        id,
        display: v.display,
        count: v.count,
      })),
    })
  } catch (error) {
    console.error('Admin follow-up-plans error:', error)
    return NextResponse.json({
      plans: [],
      total: 0,
      page: 1,
      limit: 50,
      totalPages: 0,
      modelStats: [],
    })
  }
}
