import { NextResponse } from 'next/server'
import { db, withDbFallback } from '@/lib/db'

// Safe empty shape so the frontend never crashes on `stats.users.total` etc.
const EMPTY_STATS = {
  users: { total: 0, onboarded: 0, plans: { free: 0, starter: 0, pro: 0 }, totalCredits: 0, recentSignups: 0 },
  leads: { total: 0, stages: {}, sources: {}, avgScore: 0, recentLeads: 0 },
  campaigns: { total: 0, active: 0, totalLeadsFound: 0 },
  notifications: { total: 0, unread: 0, types: {} },
}

export async function GET() {
  try {
    const [users, leads, campaigns, notifications] = await withDbFallback(
      async (client) =>
        Promise.all([
          client.user.findMany({ select: { id: true, plan: true, credits: true, createdAt: true, onboarded: true } }),
          client.lead.findMany({ select: { id: true, stage: true, score: true, source: true, createdAt: true } }),
          client.prospectionCampaign.findMany({ select: { id: true, status: true, leadsFound: true, createdAt: true } }),
          client.notification.findMany({ select: { id: true, type: true, read: true } }),
        ]),
      [[], [], [], []],
    )

    const totalUsers = users.length
    const onboardedUsers = users.filter(u => u.onboarded).length
    const planDistribution = {
      free: users.filter(u => u.plan === 'free').length,
      starter: users.filter(u => u.plan === 'starter').length,
      pro: users.filter(u => u.plan === 'pro').length,
    }
    const totalCredits = users.reduce((sum, u) => sum + u.credits, 0)

    const totalLeads = leads.length
    const stageDistribution: Record<string, number> = {}
    leads.forEach(l => { stageDistribution[l.stage] = (stageDistribution[l.stage] || 0) + 1 })
    const sourceDistribution: Record<string, number> = {}
    leads.forEach(l => { sourceDistribution[l.source] = (sourceDistribution[l.source] || 0) + 1 })
    const avgScore = totalLeads > 0 ? Math.round(leads.reduce((s, l) => s + l.score, 0) / totalLeads) : 0

    const totalCampaigns = campaigns.length
    const activeCampaigns = campaigns.filter(c => c.status === 'active').length
    const totalLeadsFound = campaigns.reduce((s, c) => s + c.leadsFound, 0)

    const totalNotifications = notifications.length
    const unreadNotifications = notifications.filter(n => !n.read).length
    const notifTypeDistribution: Record<string, number> = {}
    notifications.forEach(n => { notifTypeDistribution[n.type] = (notifTypeDistribution[n.type] || 0) + 1 })

    // Recent signups (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentUsers = users.filter(u => new Date(u.createdAt) >= sevenDaysAgo).length
    const recentLeads = leads.filter(l => new Date(l.createdAt) >= sevenDaysAgo).length

    return NextResponse.json({
      users: { total: totalUsers, onboarded: onboardedUsers, plans: planDistribution, totalCredits, recentSignups: recentUsers },
      leads: { total: totalLeads, stages: stageDistribution, sources: sourceDistribution, avgScore, recentLeads },
      campaigns: { total: totalCampaigns, active: activeCampaigns, totalLeadsFound },
      notifications: { total: totalNotifications, unread: unreadNotifications, types: notifTypeDistribution },
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    // Always return 200 with safe empty shape — never crash the frontend.
    return NextResponse.json(EMPTY_STATS, { status: 200 })
  }
}
