import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [users, leads, campaigns, notifications] = await Promise.all([
      db.user.findMany({ select: { id: true, plan: true, credits: true, createdAt: true, onboarded: true } }),
      db.lead.findMany({ select: { id: true, stage: true, score: true, source: true, createdAt: true } }),
      db.prospectionCampaign.findMany({ select: { id: true, status: true, leadsFound: true, createdAt: true } }),
      db.notification.findMany({ select: { id: true, type: true, read: true } }),
    ])

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
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
