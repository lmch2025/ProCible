import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/seed - Seed demo data
export async function POST() {
  try {
    // Create demo user
    const user = await db.user.upsert({
      where: { phone: '+237600000000' },
      update: {},
      create: {
        phone: '+237600000000',
        name: 'Utilisateur Demo',
        plan: 'starter',
        credits: 12,
        onboarded: true,
      },
    })

    // Create demo leads
    const leadsData = [
      { name: 'Marie Ndongo', business: 'Restaurant Le Palmier', sector: 'Restauration', city: 'Douala', phone: '+237699112233', whatsapp: '+237699112233', source: 'maps' as const, address: 'Bonapriso, Douala' },
      { name: 'Jean-Pierre Fotso', business: 'Fotso Electronics', sector: 'Commerce', city: 'Yaoundé', phone: '+237677445566', whatsapp: '+237677445566', source: 'facebook' as const, address: 'Bastos, Yaoundé' },
      { name: 'Fatou Amadou', business: 'Salon Beauté Fatou', sector: 'Beauté', city: 'Douala', phone: '+237655778899', whatsapp: '+237655778899', source: 'instagram' as const, address: 'Akwa, Douala' },
      { name: 'Paul Essomba', business: 'Cyber Cafe Digital', sector: 'Services', city: 'Bafoussam', phone: '+237644332211', whatsapp: '+237644332211', source: 'linkedin' as const, address: 'Centre Ville, Bafoussam' },
      { name: 'Chloé Mbarga', business: 'Mbarga Fashion House', sector: 'Mode', city: 'Douala', phone: '+237633221100', whatsapp: '+237633221100', source: 'instagram' as const, address: 'Deido, Douala' },
      { name: 'Alain Toukam', business: 'Toukam Auto Parts', sector: 'Automobile', city: 'Yaoundé', phone: '+237622110099', whatsapp: '+237622110099', source: 'maps' as const, address: 'Nlongkak, Yaoundé' },
      { name: 'Sylvie Ngassa', business: 'Ngassa Catering', sector: 'Restauration', city: 'Douala', phone: '+237611009988', whatsapp: '+237611009988', source: 'facebook' as const, address: 'Bonamoussadi, Douala' },
      { name: 'Ibrahim Haman', business: 'Haman Tech Solutions', sector: 'Technologie', city: 'Garoua', phone: '+237600998877', whatsapp: '+237600998877', source: 'linkedin' as const, address: 'Quartier Commercial, Garoua' },
    ]

    for (const lead of leadsData) {
      await db.lead.upsert({
        where: { id: `demo-${lead.phone}` },
        update: {},
        create: {
          id: `demo-${lead.phone}`,
          ...lead,
          userId: user.id,
          status: 'new',
        },
      })
    }

    // Create demo notifications (only if not already existing)
    const existingNotifs = await db.notification.findMany({
      where: { userId: user.id },
    })
    if (existingNotifs.length === 0) {
      const notifData = [
        { type: 'new_leads', title: '8 nouveaux prospects', message: 'Hermes a trouvé 8 nouveaux prospects pendant la nuit dans votre zone.' },
        { type: 'system', title: 'Bienvenue sur Hermes', message: 'Votre assistant de prospection est actif. Il cherche des prospects pour vous chaque nuit.' },
        { type: 'subscription', title: 'Crédits disponibles', message: 'Vous avez 12 crédits restants sur votre plan Starter.' },
      ]
      for (const notif of notifData) {
        await db.notification.create({
          data: {
            ...notif,
            userId: user.id,
          },
        })
      }
    }

    // Create preferences
    await db.preference.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        sectors: 'Restauration,Commerce,Beauté,Technologie,Mode',
        cities: 'Douala,Yaoundé',
        businessType: 'restaurant,boutique,salon,service',
      },
    })

    return NextResponse.json({ success: true, userId: user.id, leadCount: leadsData.length })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 })
  }
}
