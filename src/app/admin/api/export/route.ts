import { NextResponse } from 'next/server'
import { db, withDbFallback } from '@/lib/db'

const HEADERS: Record<string, string> = {
  users: 'ID,Nom,Telephone,Plan,Credits,Onboarded,Clients,Campagnes,Secteurs,Villes,Date Inscription\n',
  leads: 'ID,Nom,Entreprise,Secteur,Ville,Telephone,Source,Etape,Score,Contacts,Proprietaire,Date Creation\n',
  campaigns: 'ID,Produit,Ville,Statut,Clients Trouves,Proprietaire,Date Creation\n',
  notifications: 'ID,Type,Titre,Message,Lu,Utilisateur,Date\n',
}

const FILENAMES: Record<string, string> = {
  users: 'utilisateurs_proCible.csv',
  leads: 'clients_proCible.csv',
  campaigns: 'campagnes_proCible.csv',
  notifications: 'notifications_proCible.csv',
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const entity = searchParams.get('entity') || 'users'

    if (!HEADERS[entity]) {
      return NextResponse.json({ error: 'Unknown entity. Use: users, leads, campaigns, notifications' }, { status: 400 })
    }

    let csv = HEADERS[entity]

    if (entity === 'users') {
      const users = await withDbFallback(
        (client) =>
          client.user.findMany({
            include: {
              _count: { select: { leads: true, campaigns: true } },
              preferences: true,
            },
            orderBy: { createdAt: 'desc' },
          }),
        [],
      )
      users.forEach(u => {
        csv += `"${u.id}","${u.name || ''}","${u.phone}","${u.plan}",${u.credits},${u.onboarded},${u._count?.leads || 0},${u._count?.campaigns || 0},"${u.preferences?.sectors || ''}","${u.preferences?.cities || ''}","${new Date(u.createdAt).toLocaleDateString('fr-FR')}"\n`
      })
    } else if (entity === 'leads') {
      const leads = await withDbFallback(
        (client) =>
          client.lead.findMany({
            include: {
              user: { select: { name: true, phone: true } },
              _count: { select: { contacts: true } },
            },
            orderBy: { createdAt: 'desc' },
          }),
        [],
      )
      leads.forEach(l => {
        csv += `"${l.id}","${l.name}","${l.business || ''}","${l.sector || ''}","${l.city || ''}","${l.phone || ''}","${l.source}","${l.stage}",${l.score},${l._count?.contacts || 0},"${l.user?.name || l.user?.phone || ''}","${new Date(l.createdAt).toLocaleDateString('fr-FR')}"\n`
      })
    } else if (entity === 'campaigns') {
      const campaigns = await withDbFallback(
        (client) =>
          client.prospectionCampaign.findMany({
            include: { user: { select: { name: true, phone: true } } },
            orderBy: { createdAt: 'desc' },
          }),
        [],
      )
      campaigns.forEach(c => {
        csv += `"${c.id}","${c.productName}","${c.city}","${c.status}",${c.leadsFound},"${c.user?.name || c.user?.phone || ''}","${new Date(c.createdAt).toLocaleDateString('fr-FR')}"\n`
      })
    } else if (entity === 'notifications') {
      const notifs = await withDbFallback(
        (client) =>
          client.notification.findMany({
            include: { user: { select: { name: true, phone: true } } },
            orderBy: { createdAt: 'desc' },
          }),
        [],
      )
      notifs.forEach(n => {
        csv += `"${n.id}","${n.type}","${n.title}","${(n.message || '').replace(/"/g, '""')}",${n.read},"${n.user?.name || n.user?.phone || ''}","${new Date(n.createdAt).toLocaleDateString('fr-FR')}"\n`
      })
    }

    // Log the export (best-effort, do not fail if this throws)
    await withDbFallback(
      (client) =>
        client.auditLog.create({
          data: {
            action: 'export',
            entity,
            adminEmail: 'admin@procible.app',
            details: JSON.stringify({ filename: FILENAMES[entity], records: csv.split('\n').length - 2 }),
          },
        }),
      null as any,
    )

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${FILENAMES[entity]}"`,
      },
    })
  } catch (error) {
    console.error('Admin export error:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}
