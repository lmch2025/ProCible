import { NextResponse } from 'next/server'
import { withDbFallback } from '@/lib/db'

// Always return 200 — even if the DB is unreachable — so the frontend
// health widget renders instead of crashing. We report `status: degraded`
// when we had to fall back.
export async function GET() {
  let dbStatus: 'connected' | 'degraded' | 'unavailable' = 'connected'
  let dbSize = 'N/A'

  const [
    userCount,
    leadCount,
    campaignCount,
    notificationCount,
    contactCount,
    auditCount,
    settingsCount,
    recentAuditLogs,
  ] = await withDbFallback(
    async (client) =>
      Promise.all([
        client.user.count(),
        client.lead.count(),
        client.prospectionCampaign.count(),
        client.notification.count(),
        client.contactHistory.count(),
        client.auditLog.count(),
        client.appSettings.count(),
        client.auditLog.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
        }),
      ]),
    [0, 0, 0, 0, 0, 0, 0, []],
  )

  // If the counts are all zero we probably fell back to mock — mark as degraded.
  const allZero =
    userCount === 0 &&
    leadCount === 0 &&
    campaignCount === 0 &&
    notificationCount === 0 &&
    contactCount === 0 &&
    auditCount === 0
  if (allZero) dbStatus = 'degraded'

  // Try to read SQLite file size (only works when the file exists locally).
  try {
    const fs = await import('fs')
    const path = await import('path')
    const dbPath = path.join(process.cwd(), 'db', 'custom.db')
    const stats = fs.statSync(dbPath)
    dbSize = (stats.size / 1024 / 1024).toFixed(2) + ' MB'
  } catch {}

  const aiStatus = process.env.OPENROUTER_API_KEY ? 'configured' : 'not_configured'

  return NextResponse.json({
    status: dbStatus === 'connected' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      size: dbSize,
      tables: {
        users: userCount,
        leads: leadCount,
        campaigns: campaignCount,
        notifications: notificationCount,
        contacts: contactCount,
        auditLogs: auditCount,
        settings: settingsCount,
      },
    },
    ai: {
      status: aiStatus,
      models: 7,
    },
    recentActivity: recentAuditLogs,
    uptime: process.uptime(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    vercel: process.env.VERCEL === '1',
  })
}
