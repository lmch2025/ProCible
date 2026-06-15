import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
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

    const leadsData = [
      { name: 'Marie Ndongo', business: 'Restaurant Le Palmier', sector: 'Restauration', city: 'Douala', phone: '+237699112233', whatsapp: '+237699112233', source: 'maps', address: 'Bonapriso, Douala', stage: 'nouveau', contactCount: 0, score: 55 },
      { name: 'Jean-Pierre Fotso', business: 'Fotso Electronics', sector: 'Commerce', city: 'Yaoundé', phone: '+237677445566', whatsapp: '+237677445566', source: 'facebook', address: 'Bastos, Yaoundé', stage: 'contacte', contactCount: 1, score: 60 },
      { name: 'Fatou Amadou', business: 'Salon Beauté Fatou', sector: 'Beauté', city: 'Douala', phone: '+237655778899', whatsapp: '+237655778899', source: 'instagram', address: 'Akwa, Douala', stage: 'en_discussion', contactCount: 2, score: 75 },
      { name: 'Paul Essomba', business: 'Cyber Cafe Digital', sector: 'Services', city: 'Bafoussam', phone: '+237644332211', whatsapp: '+237644332211', source: 'linkedin', address: 'Centre Ville, Bafoussam', stage: 'a_relancer', contactCount: 1, score: 40 },
      { name: 'Chloé Mbarga', business: 'Mbarga Fashion House', sector: 'Mode', city: 'Douala', phone: '+237633221100', whatsapp: '+237633221100', source: 'instagram', address: 'Deido, Douala', stage: 'nouveau', contactCount: 0, score: 50 },
      { name: 'Alain Toukam', business: 'Toukam Auto Parts', sector: 'Automobile', city: 'Yaoundé', phone: '+237622110099', whatsapp: '+237622110099', source: 'maps', address: 'Nlongkak, Yaoundé', stage: 'contacte', contactCount: 1, score: 65 },
      { name: 'Sylvie Ngassa', business: 'Ngassa Catering', sector: 'Restauration', city: 'Douala', phone: '+237611009988', whatsapp: '+237611009988', source: 'facebook', address: 'Bonamoussadi, Douala', stage: 'gagne', contactCount: 4, score: 95 },
      { name: 'Ibrahim Haman', business: 'Haman Tech Solutions', sector: 'Technologie', city: 'Garoua', phone: '+237600998877', whatsapp: '+237600998877', source: 'linkedin', address: 'Quartier Commercial, Garoua', stage: 'nouveau', contactCount: 0, score: 52 },
    ]

    for (const lead of leadsData) {
      await db.lead.upsert({
        where: { id: `demo-${lead.phone}` },
        update: {
          stage: lead.stage,
          contactCount: lead.contactCount,
          score: lead.score,
          lastContactAt: lead.contactCount > 0 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
          nextFollowUpAt: lead.stage !== 'gagne' && lead.stage !== 'perdu' ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : null,
          aiSuggestion: lead.stage === 'a_relancer' ? 'Relance urgente — ce lead n\'a pas répondu depuis un moment.' : lead.stage === 'en_discussion' ? 'Discussion en cours — proposez un rendez-vous pour conclure.' : lead.stage === 'nouveau' ? 'Premier contact recommandé — appelez ou envoyez un WhatsApp.' : null,
        },
        create: {
          id: `demo-${lead.phone}`,
          ...lead,
          userId: user.id,
          lastContactAt: lead.contactCount > 0 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
          nextFollowUpAt: lead.stage !== 'gagne' && lead.stage !== 'perdu' ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : null,
          aiSuggestion: lead.stage === 'a_relancer' ? 'Relance urgente — ce lead n\'a pas répondu depuis un moment.' : lead.stage === 'en_discussion' ? 'Discussion en cours — proposez un rendez-vous pour conclure.' : lead.stage === 'nouveau' ? 'Premier contact recommandé — appelez ou envoyez un WhatsApp.' : null,
        },
      })

      // Create contact history for leads that have been contacted
      if (lead.contactCount >= 1) {
        await db.contactHistory.createMany({
          data: Array.from({ length: lead.contactCount }, (_, i) => ({
            leadId: `demo-${lead.phone}`,
            type: i === 0 ? 'whatsapp' : 'appel',
            content: i === 0 ? `Premier contact WhatsApp avec ${lead.name}` : `Appel de suivi avec ${lead.name}`,
            aiGenerated: false,
            createdAt: new Date(Date.now() - (lead.contactCount - i) * 2 * 24 * 60 * 60 * 1000),
          })),
        })
      }
    }

    // Notifications
    const existingNotifs = await db.notification.findMany({ where: { userId: user.id } })
    if (existingNotifs.length === 0) {
      const notifData = [
        { type: 'new_leads', title: '5 nouveaux prospects', message: 'Hermes a trouvé 5 nouveaux prospects pendant la nuit dans votre zone.', userId: user.id },
        { type: 'follow_up', title: 'Suivi requis', message: 'Paul Essomba n\'a pas été contacté depuis 5 jours. Relancez-le !', userId: user.id, leadId: 'demo-+237644332211' },
        { type: 'ai_suggestion', title: 'Conseil IA', message: 'Fatou Amadou est en discussion. Proposez-lui un rendez-vous pour conclure.', userId: user.id, leadId: 'demo-+237655778899' },
        { type: 'relance', title: 'Relance urgente', message: 'Paul Essomba attend une relance depuis plus de 5 jours.', userId: user.id, leadId: 'demo-+237644332211' },
        { type: 'system', title: 'Bienvenue sur Hermes CRM', message: 'Votre CRM intelligent est actif. Suivez vos leads et laissez l\'IA vous guider.', userId: user.id },
      ]
      for (const notif of notifData) {
        await db.notification.create({ data: notif })
      }
    }

    // Preferences
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
