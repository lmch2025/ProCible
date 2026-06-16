import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [
      userCount,
      leadCount,
      campaignCount,
      notificationCount,
      contactCount,
      auditCount,
      settingsCount,
      recentAuditLogs,
    ] = await Promise.all([
      db.user.count(),
      db.lead.count(),
      db.prospectionCampaign.count(),
      db.notification.count(),
      db.contactHistory.count(),
      db.auditLog.count(),
      db.appSettings.count(),
      db.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    // Check database connectivity
    const dbStatus = 'connected'
    let dbSize = 'N/A'
    try {
      const fs = await import('fs')
      const path = await import('path')
      const dbPath = path.join(process.cwd(), 'db', 'custom.db')
      const stats = fs.statSync(dbPath)
      dbSize = (stats.size / 1024 / 1024).toFixed(2) + ' MB'
    } catch {}

    // Check AI service
    const aiStatus = process.env.OPENROUTER_API_KEY ? 'configured' : 'not_configured'

    return NextResponse.json({
      status: 'healthy',
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
    })
  } catch (error) {
    console.error('Admin health error:', error)
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 503 })
  }
}
