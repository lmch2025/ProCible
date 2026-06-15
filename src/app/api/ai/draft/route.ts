import { NextResponse } from 'next/server'
import { generateMessageDraft } from '@/lib/ai-service'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { leadId, channel } = body

    if (!leadId || !channel) {
      return NextResponse.json({ error: 'leadId and channel required' }, { status: 400 })
    }

    const lead = await db.lead.findUnique({ where: { id: leadId } })
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const lastContact = await db.contactHistory.findFirst({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    })

    const result = await generateMessageDraft({
      leadName: lead.name,
      business: lead.business,
      sector: lead.sector,
      city: lead.city,
      contactCount: lead.contactCount,
      lastContactType: lastContact?.type || null,
      lastContactDate: lastContact?.createdAt?.toISOString() || null,
      stage: lead.stage,
      channel,
    })

    await db.lead.update({
      where: { id: leadId },
      data: { aiSuggestion: result.content.substring(0, 500) },
    })

    return NextResponse.json({
      draft: result.content,
      model: result.modelName,
      leadId,
    })
  } catch (error) {
    console.error('AI draft error:', error)
    return NextResponse.json({ error: 'Failed to generate draft' }, { status: 500 })
  }
}
