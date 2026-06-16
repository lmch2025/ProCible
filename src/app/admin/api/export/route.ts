import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const entity = searchParams.get('entity') || 'users'

    let csv = ''
    let filename = ''

    if (entity === 'users') {
      const users = await db.user.findMany({
        include: {
          _count: { select: { leads: true, campaigns: true } },
          preferences: true,
        },
        orderBy: { createdAt: 'desc' },
      })
      csv = 'ID,Nom,Telephone,Plan,Credits,Onboarded,Clients,Campagnes,Secteurs,Villes,Date Inscription\n'
      users.forEach(u => {
        csv += `"${u.id}","${u.name || ''}","${u.phone}","${u.plan}",${u.credits},${u.onboarded},${u._count.leads},${u._count.campaigns},"${u.preferences?.sectors || ''}","${u.preferences?.cities || ''}","${new Date(u.createdAt).toLocaleDateString('fr-FR')}"\n`
      })
      filename = 'utilisateurs_proCible.csv'
    } else if (entity === 'leads') {
      const leads = await db.lead.findMany({
        include: {
          user: { select: { name: true, phone: true } },
          _count: { select: { contacts: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      csv = 'ID,Nom,Entreprise,Secteur,Ville,Telephone,Source,Etape,Score,Contacts,Proprietaire,Date Creation\n'
      leads.forEach(l => {
        csv += `"${l.id}","${l.name}","${l.business || ''}","${l.sector || ''}","${l.city || ''}","${l.phone || ''}","${l.source}","${l.stage}",${l.score},${l._count.contacts},"${l.user?.name || l.user?.phone || ''}","${new Date(l.createdAt).toLocaleDateString('fr-FR')}"\n`
      })
      filename = 'clients_proCible.csv'
    } else if (entity === 'campaigns') {
      const campaigns = await db.prospectionCampaign.findMany({
        include: { user: { select: { name: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
      })
      csv = 'ID,Produit,Ville,Statut,Clients Trouves,Proprietaire,Date Creation\n'
      campaigns.forEach(c => {
        csv += `"${c.id}","${c.productName}","${c.city}","${c.status}",${c.leadsFound},"${c.user?.name || c.user?.phone || ''}","${new Date(c.createdAt).toLocaleDateString('fr-FR')}"\n`
      })
      filename = 'campagnes_proCible.csv'
    } else if (entity === 'notifications') {
      const notifs = await db.notification.findMany({
        include: { user: { select: { name: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
      })
      csv = 'ID,Type,Titre,Message,Lu,Utilisateur,Date\n'
      notifs.forEach(n => {
        csv += `"${n.id}","${n.type}","${n.title}","${n.message.replace(/"/g, '""')}",${n.read},"${n.user?.name || n.user?.phone || ''}","${new Date(n.createdAt).toLocaleDateString('fr-FR')}"\n`
      })
      filename = 'notifications_proCible.csv'
    } else {
      return NextResponse.json({ error: 'Unknown entity. Use: users, leads, campaigns, notifications' }, { status: 400 })
    }

    // Log the export
    await db.auditLog.create({
      data: {
        action: 'export',
        entity,
        adminEmail: 'admin@procible.app',
        details: JSON.stringify({ filename, records: csv.split('\n').length - 2 }),
      },
    })

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Admin export error:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}
