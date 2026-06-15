import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { leadId, type, content, aiGenerated } = body

    if (!leadId || !type) {
      return NextResponse.json({ error: 'leadId and type required' }, { status: 400 })
    }

    const contact = await db.contactHistory.create({
      data: {
        leadId,
        type,
        content: content || null,
        aiGenerated: aiGenerated || false,
      },
    })

    const lead = await db.lead.findUnique({ where: { id: leadId } })
    if (lead) {
      const newCount = lead.contactCount + 1
      let newStage = lead.stage

      if (lead.stage === 'nouveau') {
        newStage = 'contacte'
      } else if (lead.stage === 'contacte' && newCount >= 2) {
        newStage = 'en_discussion'
      }

      const nextFollowUp = new Date()
      nextFollowUp.setDate(nextFollowUp.getDate() + 3)

      await db.lead.update({
        where: { id: leadId },
        data: {
          contactCount: newCount,
          lastContactAt: new Date(),
          nextFollowUpAt: nextFollowUp,
          stage: newStage,
        },
      })
    }

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    console.error('Contact log error:', error)
    return NextResponse.json({ error: 'Failed to log contact' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('leadId')

    if (!leadId) {
      return NextResponse.json({ error: 'leadId required' }, { status: 400 })
    }

    const contacts = await db.contactHistory.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(contacts)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}
