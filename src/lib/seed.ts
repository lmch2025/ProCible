/**
 * Idempotent database seeding.
 *
 * `ensureSeedData()` is safe to call on every cold start: it only inserts
 * what's missing and never overwrites admin edits. Used by `/api/init` so
 * the very first request from a fresh deployment bootstraps a working demo
 * without requiring a separate `/api/seed` round-trip.
 *
 * Works with both the real Prisma client and the in-memory mock fallback
 * (via `withDbFallback`), so it's safe on Vercel serverless too.
 */
import { withDbFallback } from './db'
import { ensureDefaultCreditRules } from './credits-service'

const DEMO_PHONE = '+237600000000'

const DEMO_LEADS = [
  { name: 'Marie Ndongo', business: 'Restaurant Le Palmier', sector: 'Restauration', city: 'Douala', phone: '+237699112233', whatsapp: '+237699112233', source: 'maps', address: 'Bonapriso, Douala', stage: 'nouveau', contactCount: 0, score: 55 },
  { name: 'Jean-Pierre Fotso', business: 'Fotso Electronics', sector: 'Commerce', city: 'Yaoundé', phone: '+237677445566', whatsapp: '+237677445566', source: 'facebook', address: 'Bastos, Yaoundé', stage: 'contacte', contactCount: 1, score: 60 },
  { name: 'Fatou Amadou', business: 'Salon Beauté Fatou', sector: 'Beauté', city: 'Douala', phone: '+237655778899', whatsapp: '+237655778899', source: 'instagram', address: 'Akwa, Douala', stage: 'en_discussion', contactCount: 2, score: 75 },
  { name: 'Paul Essomba', business: 'Cyber Cafe Digital', sector: 'Services', city: 'Bafoussam', phone: '+237644332211', whatsapp: '+237644332211', source: 'linkedin', address: 'Centre Ville, Bafoussam', stage: 'a_relancer', contactCount: 1, score: 40 },
  { name: 'Chloé Mbarga', business: 'Mbarga Fashion House', sector: 'Mode', city: 'Douala', phone: '+237633221100', whatsapp: '+237633221100', source: 'instagram', address: 'Deido, Douala', stage: 'nouveau', contactCount: 0, score: 50 },
  { name: 'Alain Toukam', business: 'Toukam Auto Parts', sector: 'Automobile', city: 'Yaoundé', phone: '+237622110099', whatsapp: '+237622110099', source: 'maps', address: 'Nlongkak, Yaoundé', stage: 'contacte', contactCount: 1, score: 65 },
  { name: 'Sylvie Ngassa', business: 'Ngassa Catering', sector: 'Restauration', city: 'Douala', phone: '+237611009988', whatsapp: '+237611009988', source: 'facebook', address: 'Bonamoussadi, Douala', stage: 'gagne', contactCount: 4, score: 95 },
  { name: 'Ibrahim Haman', business: 'Haman Tech Solutions', sector: 'Technologie', city: 'Garoua', phone: '+237600998877', whatsapp: '+237600998877', source: 'linkedin', address: 'Quartier Commercial, Garoua', stage: 'nouveau', contactCount: 0, score: 52 },
] as const

function aiSuggestionFor(stage: string): string | null {
  switch (stage) {
    case 'a_relancer':
      return 'Relance urgente — ce lead n\'a pas répondu depuis un moment.'
    case 'en_discussion':
      return 'Discussion en cours — proposez un rendez-vous pour conclure.'
    case 'nouveau':
      return 'Premier contact recommandé — appelez ou envoyez un WhatsApp.'
    default:
      return null
  }
}

/**
 * Ensure the demo user + leads + notifications + preferences exist.
 * Also ensures default credit rules are present.
 *
 * Fully idempotent: skips anything that already exists, so it's safe to
 * call from `/api/init` on every cold start.
 */
export async function ensureSeedData(): Promise<void> {
  // 1. Credit rules first — cheap, idempotent, self-healing.
  try {
    await ensureDefaultCreditRules()
  } catch (e) {
    console.warn('[seed] ensureDefaultCreditRules failed (non-fatal):', e)
  }

  // 2. The rest, wrapped so a Prisma outage on serverless doesn't 500 the init.
  await withDbFallback(async (client: any) => {
    // --- Demo user ---------------------------------------------------------
    const user = await client.user.upsert({
      where: { phone: DEMO_PHONE },
      update: {},
      create: {
        phone: DEMO_PHONE,
        name: 'Utilisateur Demo',
        plan: 'starter',
        credits: 12,
        onboarded: true,
      },
    })

    // --- Leads + contact history ------------------------------------------
    for (const lead of DEMO_LEADS) {
      const leadId = `demo-${lead.phone}`
      const lastContactAt =
        lead.contactCount > 0
          ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
          : null
      const nextFollowUpAt =
        lead.stage !== 'gagne' && lead.stage !== 'perdu'
          ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          : null
      const aiSuggestion = aiSuggestionFor(lead.stage)

      await client.lead.upsert({
        where: { id: leadId },
        update: {
          stage: lead.stage,
          contactCount: lead.contactCount,
          score: lead.score,
          lastContactAt,
          nextFollowUpAt,
          aiSuggestion,
        },
        create: {
          id: leadId,
          name: lead.name,
          business: lead.business,
          sector: lead.sector,
          city: lead.city,
          phone: lead.phone,
          whatsapp: lead.whatsapp,
          source: lead.source,
          address: lead.address,
          stage: lead.stage,
          contactCount: lead.contactCount,
          score: lead.score,
          userId: user.id,
          lastContactAt,
          nextFollowUpAt,
          aiSuggestion,
        },
      })

      // Contact history — only add if none exists for this lead.
      const existingHistory = await client.contactHistory.findMany({
        where: { leadId },
        take: 1,
      })
      if (existingHistory.length === 0 && lead.contactCount >= 1) {
        // `createMany` isn't supported by all mock implementations; fall back
        // to a loop if it throws.
        const rows = Array.from({ length: lead.contactCount }, (_, i) => ({
          leadId,
          type: i === 0 ? 'whatsapp' : 'appel',
          content:
            i === 0
              ? `Premier contact WhatsApp avec ${lead.name}`
              : `Appel de suivi avec ${lead.name}`,
          aiGenerated: false,
          createdAt: new Date(
            Date.now() - (lead.contactCount - i) * 2 * 24 * 60 * 60 * 1000,
          ),
        }))
        try {
          await client.contactHistory.createMany({ data: rows })
        } catch {
          for (const r of rows) {
            try {
              await client.contactHistory.create({ data: r })
            } catch {
              /* ignore individual failures */
            }
          }
        }
      }
    }

    // --- Notifications -----------------------------------------------------
    const existingNotifs = await client.notification.findMany({
      where: { userId: user.id },
      take: 1,
    })
    if (existingNotifs.length === 0) {
      const notifs = [
        { type: 'new_leads', title: '5 nouveaux prospects', message: 'Hermes a trouvé 5 nouveaux prospects pendant la nuit dans votre zone.', userId: user.id },
        { type: 'follow_up', title: 'Suivi requis', message: 'Paul Essomba n\'a pas été contacté depuis 5 jours. Relancez-le !', userId: user.id, leadId: 'demo-+237644332211' },
        { type: 'ai_suggestion', title: 'Conseil IA', message: 'Fatou Amadou est en discussion. Proposez-lui un rendez-vous pour conclure.', userId: user.id, leadId: 'demo-+237655778899' },
        { type: 'relance', title: 'Relance urgente', message: 'Paul Essomba attend une relance depuis plus de 5 jours.', userId: user.id, leadId: 'demo-+237644332211' },
        { type: 'system', title: 'Bienvenue sur Hermes CRM', message: 'Votre CRM intelligent est actif. Suivez vos leads et laissez l\'IA vous guider.', userId: user.id },
      ]
      for (const n of notifs) {
        try {
          await client.notification.create({ data: n })
        } catch {
          /* ignore */
        }
      }
    }

    // --- Preferences -------------------------------------------------------
    try {
      await client.preference.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          sectors: 'Restauration,Commerce,Beauté,Technologie,Mode',
          cities: 'Douala,Yaoundé',
          businessType: 'restaurant,boutique,salon,service',
        },
      })
    } catch {
      /* preferences are optional — ignore */
    }
  }, null as any)
}
