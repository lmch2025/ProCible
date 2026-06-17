import { NextResponse } from 'next/server'
import { db, ensureSeedData } from '@/lib/db'

// Single endpoint that returns ALL data the app needs on startup
// Replaces 4 sequential API calls with 1 parallel call
export async function POST() {
  try {
    // Auto-seed if needed (idempotent — skips if data exists)
    await ensureSeedData()

    // Get demo user
    const user = await db.user.findFirst({ where: { phone: '+237600000000' } })
    const userId = user?.id || null

    if (!userId) {
      return NextResponse.json({ userId: null, leads: [], notifications: [], campaigns: [] })
    }

    // Fetch all data in parallel — much faster than sequential
    const [leads, notifications, campaigns] = await Promise.all([
      db.lead.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { contacts: { orderBy: { createdAt: 'desc' }, take: 5 } },
      }),
      db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      db.prospectionCampaign.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    // Serialize dates for JSON
    const serializedLeads = leads.map(l => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
      lastContactAt: l.lastContactAt?.toISOString() || null,
      nextFollowUpAt: l.nextFollowUpAt?.toISOString() || null,
      contacts: l.contacts.map(c => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      })),
    }))

    const serializedNotifs = notifications.map(n => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    }))

    const serializedCampaigns = campaigns.map(c => ({
      ...c,
      images: c.images ? String(c.images).split(',').filter(Boolean) : [],
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }))

    return NextResponse.json({
      userId,
      leads: serializedLeads,
      notifications: serializedNotifs,
      campaigns: serializedCampaigns,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('[Init] Error:', error)
    return NextResponse.json({ error: 'Init failed' }, { status: 500 })
  }
}
