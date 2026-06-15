import { NextResponse } from 'next/server'
import { analyzeLead } from '@/lib/ai-service'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { leadId } = body

    if (!leadId) {
      return NextResponse.json({ error: 'leadId required' }, { status: 400 })
    }

    const lead = await db.lead.findUnique({ where: { id: leadId } })
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const daysSince = lead.lastContactAt
      ? Math.floor((Date.now() - new Date(lead.lastContactAt).getTime()) / (1000 * 60 * 60 * 24))
      : null

    const { suggestion, score } = await analyzeLead({
      leadName: lead.name,
      business: lead.business,
      sector: lead.sector,
      city: lead.city,
      contactCount: lead.contactCount,
      stage: lead.stage,
      daysSinceLastContact: daysSince,
      source: lead.source,
    })

    await db.lead.update({
      where: { id: leadId },
      data: { score, aiSuggestion: suggestion },
    })

    return NextResponse.json({ suggestion, score, leadId })
  } catch (error) {
    console.error('AI analyze error:', error)
    return NextResponse.json({ error: 'Failed to analyze lead' }, { status: 500 })
  }
}
