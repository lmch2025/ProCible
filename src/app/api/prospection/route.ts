import { NextResponse } from 'next/server'
import { db, withDbFallback } from '@/lib/db'
import { parseLocations, countLocations } from '@/lib/locations'
import { deductCredits, getEffectiveCost, grantCredits } from '@/lib/credits-service'
import { interpretCampaign, type CampaignInterpretation } from '@/lib/ai-service'

/** Helper for safe refund. */
async function grantCreditsSafe(userId: string, amount: number, note: string) {
  try {
    await grantCredits({
      userId,
      amount,
      action: 'system.refund',
      label: 'Remboursement de crédits',
      note,
    })
  } catch (e) {
    console.error('Refund failed:', e)
  }
}

/**
 * POST /api/prospection — launch a prospection campaign.
 *
 * Body:
 *   - productName: string  (required)
 *   - images: string       (optional, comma-separated data URLs)
 *   - userId: string       (optional; defaults to demo user +237600000000)
 *   - locations: string    (required, comma-separated "ISO2:CityName" or "ISO2:all")
 *
 * Returns the created campaign. The actual lead-finding is simulated:
 * we generate ~5–15 leads per location with realistic Cameroon/Africa names,
 * tag them with the matching city/country, and persist them so they show up
 * in the user's CRM pipeline.
 */

const DEMO_NAMES = [
  'Marie Ndongo', 'Jean-Pierre Fotso', 'Fatou Amadou', 'Paul Essomba', 'Chloé Mbarga',
  'Alain Toukam', 'Sylvie Ngassa', 'Ibrahim Haman', 'Awa Ngono', 'Jean Ekambi',
  'Fatou Diallo', 'Paul Mballa', 'Sara Bello', 'Omar Sy', 'Aïcha Bello',
  'Bernard Kameni', 'Cynthia Atangana', 'David Tchatchou', 'Estelle Mfoumou',
  'Georges Kamga', 'Hélène Biya', 'Ivan Mbarga', 'Julie Tchoumi', 'Karim Touré',
]

const DEMO_BUSINESSES: Record<string, string[]> = {
  Restauration: ['Restaurant', 'Café', 'Pâtisserie', 'Snack', 'Catering', 'Bar'],
  Commerce: ['Boutique', 'Épicerie', 'Quincaillerie', 'Bazar', 'Boutique Mode'],
  Beauté: ['Salon de coiffure', 'Salon Beauté', 'Spa', 'Institut', 'Barbier'],
  Santé: ['Pharmacie', 'Cabinet médical', 'Laboratoire', 'Clinique', 'Opticien'],
  Automobile: ['Garage auto', 'Pièces auto', 'Station-service', 'Lavage auto', 'Concessionnaire'],
  Services: ['Cyber café', 'Imprimerie', 'Agence immobilière', 'Comptable', 'Traducteur'],
  Technologie: ['Boutique informatique', 'Réparation téléphone', 'Studio photo', 'Développeur web', 'Câblage réseau'],
  Mode: ['Boutique prêt-à-porter', 'Couture', 'Chaussures', 'Accessoires', 'Maroquinerie'],
  Éducation: ['Librairie', 'École privée', 'Centre de formation', 'Cours particuliers', 'Soutien scolaire'],
  Agriculture: ['Coopérative agricole', 'Boutique agricole', 'Élevage', 'Semences', 'Matériel agricole'],
}

const SECTORS = Object.keys(DEMO_BUSINESSES)
const STREETS_BY_COUNTRY: Record<string, string[]> = {
  CM: ['Akwa', 'Bonapriso', 'Bonanjo', 'Deido', 'Bastos', 'Centre-ville', 'Mvan', 'Bonamoussadi', 'Nlongkak', 'Marché A'],
  CI: ['Cocody', 'Plateau', 'Treichville', 'Yopougon', 'Marcory', 'Adjamé', 'Koumassi'],
  SN: ['Plateau', 'Médina', 'Pikine', 'Parcelles', 'HLM', 'Fann', 'Liberté 6'],
  default: ['Centre-ville', 'Quartier Commercial', 'Marché Central', 'Zone Résidentielle'],
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomPhone(dialCode: string): string {
  const rest = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('')
  return `${dialCode}6${rest}` // local mobile convention
}

function leadNameFromLocation(countryIso2: string, city: string, idx: number): string {
  const name = pick(DEMO_NAMES)
  const sector = pick(SECTORS)
  const businessType = pick(DEMO_BUSINESSES[sector])
  const businessName = `${businessType} ${pick(['du Centre', 'de la Paix', 'Le Baobab', 'Romarin', 'Élégance', 'Savoir', 'Express', 'Plus'])}`
  const streets = STREETS_BY_COUNTRY[countryIso2] || STREETS_BY_COUNTRY.default
  return JSON.stringify({
    name,
    business: businessName,
    sector,
    city,
    country: countryIso2,
    phone: randomPhone('+237'), // demo only
    whatsapp: randomPhone('+237'),
    source: pick(['maps', 'facebook', 'instagram']),
    address: `${pick(streets)}, ${city}`,
    score: 40 + Math.floor(Math.random() * 50),
    notes: idx === 0 ? 'Premier lead généré pour cette campagne.' : null,
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { productName, images, userId, locations } = body

    if (!productName || !productName.trim()) {
      return NextResponse.json({ error: 'productName requis' }, { status: 400 })
    }
    if (!locations || !String(locations).trim()) {
      return NextResponse.json({ error: 'Au moins une ville ou un pays requis' }, { status: 400 })
    }

    const parsed = parseLocations(locations)
    if (parsed.length === 0) {
      return NextResponse.json({ error: 'Localisations invalides' }, { status: 400 })
    }

    // Resolve userId — default to demo user
    let finalUserId = userId
    if (!finalUserId) {
      const demoUser = await withDbFallback(
        (client) => client.user.upsert({
          where: { phone: '+237600000000' },
          update: {},
          create: { phone: '+237600000000', name: 'Utilisateur Demo', plan: 'starter', credits: 12, onboarded: true },
        }),
        null as any,
      )
      finalUserId = demoUser?.id
    }
    if (!finalUserId) {
      return NextResponse.json({ error: 'Impossible de résoudre l\'utilisateur' }, { status: 500 })
    }

    // --- Credit check & deduction (atomic) ---
    const idempotencyKey = `prospection:${finalUserId}:${productName.trim()}:${locations}:${Date.now().toString(36)}`
    const costInfo = await getEffectiveCost('prospection.launch', finalUserId)
    if (costInfo.cost > 0) {
      // Pre-check balance so we can return a clean 402 before doing any work.
      const balance = await withDbFallback(
        (client) => (client as any).user.findUnique({ where: { id: finalUserId }, select: { credits: true } }),
        null as any,
      )
      if (balance && balance.credits < costInfo.cost) {
        return NextResponse.json({
          error: `Crédits insuffisants. Cette action coûte ${costInfo.cost} crédit(s). Solde actuel : ${balance.credits}.`,
          code: 'insufficient_credits',
          required: costInfo.cost,
          balance: balance.credits,
        }, { status: 402 })
      }
    }
    // Deduct (or log free-quota use).
    const deduct = await deductCredits({
      userId: finalUserId,
      action: 'prospection.launch',
      entityId: null, // will be set after campaign creation
      idempotencyKey,
      note: `Campagne « ${productName.trim()} » (${countLocations(locations)} zone(s))`,
    })
    if (!deduct.ok) {
      return NextResponse.json({
        error: deduct.reason === 'insufficient'
          ? `Crédits insuffisants. Cette action coûte ${deduct.cost} crédit(s).`
          : 'Échec de la déduction de crédits',
        code: deduct.reason === 'insufficient' ? 'insufficient_credits' : 'deduct_failed',
        required: deduct.cost,
      }, { status: 402 })
    }

    // Derive a legacy `city` for backward-compat views (first non-"all" city, or country name).
    const firstCity = parsed.find((p) => p.city !== null)?.city
    const firstCountry = parsed[0]?.country || ''
    const legacyCity = firstCity || (firstCountry ? `Tout ${firstCountry}` : '')

    // Create the campaign
    const campaign = await withDbFallback(
      (client) => client.prospectionCampaign.create({
        data: {
          productName: productName.trim(),
          images: images || '',
          city: legacyCity,
          locations: String(locations),
          status: 'active',
          leadsFound: 0,
          userId: finalUserId,
        },
      }),
      null as any,
    )

    if (!campaign) {
      // Refund the deduction since the campaign failed.
      if (deduct.cost > 0) {
        await grantCreditsSafe(finalUserId, deduct.cost, `Remboursement : échec création campagne « ${productName.trim()} »`)
      }
      return NextResponse.json({ error: 'Échec création campagne' }, { status: 500 })
    }

    // --- AI CAMPAIGN INTERPRETATION (free, included in every launch) ---
    // The AI transforms the user's product description into a refined search
    // query that finds CUSTOMERS for the product — not competitors selling
    // the same product. We use the AI's `targetSegments` to prioritize lead
    // sectors and `exclusions` to filter out competitor-like businesses.
    let interpretation: CampaignInterpretation | null = null
    try {
      interpretation = await interpretCampaign({
        productName: productName.trim(),
        locations: String(locations),
      })
    } catch (e) {
      console.warn('[prospection] AI interpretation failed, continuing with fallback:', e instanceof Error ? e.message : e)
    }

    // Build a sector priority list from the interpretation.
    // Sectors in targetSegments get +1 priority weight; sectors/businesses
    // matching any exclusion pattern get rejected entirely.
    const targetSectorsLower = (interpretation?.targetSegments || []).map((s) => s.toLowerCase())
    const exclusionsLower = (interpretation?.exclusions || []).map((e) => e.toLowerCase())

    /** Returns true if the lead looks like a COMPETITOR (must be excluded). */
    function isCompetitor(business: string, sector: string): boolean {
      const b = business.toLowerCase()
      const s = sector.toLowerCase()
      return exclusionsLower.some((ex) => b.includes(ex) || s.includes(ex))
    }

    /** Returns a priority score for a sector (higher = more relevant buyer). */
    function sectorPriority(sector: string): number {
      const s = sector.toLowerCase()
      let p = 0
      for (const t of targetSectorsLower) {
        if (s.includes(t) || t.includes(s)) p += 10
        // Partial word match
        else if (t.split(/\s+/).some((w) => w.length > 3 && s.includes(w))) p += 3
      }
      return p
    }

    // Generate leads per location. For a specific city we tag leads with that city.
    // For "whole country" we tag leads with the country's French name (since we
    // don't have a curated city list for all 250 countries) and generate more.
    //
    // AI-driven generation: we OVER-generate candidates then filter+rank by
    // the AI's interpretation. This means:
    //   - Leads matching `exclusions` (competitors) are dropped
    //   - Leads matching `targetSegments` (priority buyers) come first
    //   - We keep up to `leadCount` survivors per location
    const createdLeads: any[] = []
    for (const loc of parsed) {
      const targetCount = loc.city === null
        ? 6 + Math.floor(Math.random() * 6) // 6–11 leads for a whole country
        : 3 + Math.floor(Math.random() * 5) // 3–7 leads for a specific city
      const cityLabel = loc.city || loc.country

      // Over-generate 2x candidates so we have headroom after filtering.
      const candidateCount = targetCount * 2
      const candidates: Array<{ data: any; priority: number }> = []
      for (let i = 0; i < candidateCount; i++) {
        const data = JSON.parse(leadNameFromLocation(loc.iso2, cityLabel, i))
        if (isCompetitor(data.business || '', data.sector || '')) {
          continue // Drop competitor-looking leads.
        }
        candidates.push({ data, priority: sectorPriority(data.sector || '') })
      }
      // Sort by priority desc (target-segment buyers first), then random for ties.
      candidates.sort((a, b) => b.priority - a.priority || Math.random() - 0.5)
      // Take the top `targetCount`, but always keep at least 2 leads per location
      // even if AI filtering was aggressive.
      const survivors = candidates.slice(0, Math.max(2, targetCount))

      // If AI filtering dropped too many, backfill with non-competitor randoms.
      while (survivors.length < Math.max(2, targetCount) && survivors.length < candidateCount) {
        const data = JSON.parse(leadNameFromLocation(loc.iso2, cityLabel, survivors.length + 100))
        if (!isCompetitor(data.business || '', data.sector || '')) {
          survivors.push({ data, priority: 0 })
        }
      }

      for (const { data, priority } of survivors) {
        // Boost the score for high-priority (target segment) leads.
        const boostedScore = Math.max(0, Math.min(100, (data.score || 50) + (priority > 0 ? 8 : 0)))
        // Tag the lead with the interpretation's buyer persona if available.
        const noteParts: string[] = []
        if (data.notes) noteParts.push(data.notes)
        if (interpretation?.buyerPersona && priority > 0) {
          noteParts.push(`Cible prioritaire : ${interpretation.buyerPersona}`)
        }
        const lead = await withDbFallback(
          (client) => client.lead.create({
            data: {
              name: data.name,
              business: data.business,
              sector: data.sector,
              city: data.city,
              phone: data.phone,
              whatsapp: data.whatsapp,
              source: data.source,
              address: data.address,
              stage: 'nouveau',
              score: boostedScore,
              notes: noteParts.join(' | ') || null,
              userId: finalUserId,
            },
          }),
          null as any,
        )
        if (lead) createdLeads.push(lead)
      }
    }

    // Update campaign with leadsFound count
    await withDbFallback(
      (client) => client.prospectionCampaign.update({
        where: { id: campaign.id },
        data: { leadsFound: createdLeads.length },
      }),
      null as any,
    )

    // Log audit (include AI interpretation summary for traceability)
    await withDbFallback(
      (client) => client.auditLog.create({
        data: {
          action: 'create',
          entity: 'campaign',
          entityId: campaign.id,
          adminEmail: 'system@procible.app',
          details: JSON.stringify({
            productName: productName.trim(),
            locations,
            leadsFound: createdLeads.length,
            aiInterpretation: interpretation
              ? {
                  model: interpretation.model,
                  searchQuery: interpretation.searchQuery,
                  targetSegments: interpretation.targetSegments,
                  exclusions: interpretation.exclusions,
                  buyerPersona: interpretation.buyerPersona,
                }
              : null,
          }),
        },
      }),
      null as any,
    )

    // Create a notification for the user
    const notifMessage = interpretation
      ? `${createdLeads.length} clients potentiels trouvés pour « ${productName.trim()} ». Cibles : ${interpretation.targetSegments.slice(0, 3).join(', ')}${interpretation.targetSegments.length > 3 ? '…' : ''}.`
      : `${createdLeads.length} nouveaux clients potentiels trouvés pour « ${productName.trim()} » (${countLocations(locations)} zone(s)).`
    await withDbFallback(
      (client) => client.notification.create({
        data: {
          userId: finalUserId,
          type: 'new_leads',
          title: 'Nouvelle campagne lancée',
          message: notifMessage,
          read: false,
        },
      }),
      null as any,
    )

    return NextResponse.json({
      campaign: { ...campaign, leadsFound: createdLeads.length },
      leadsFound: createdLeads.length,
      leads: createdLeads.slice(0, 10), // return first 10 for instant UI feedback
      creditsUsed: deduct.cost,
      creditsFreeQuotaUsed: deduct.freeQuotaUsed,
      balanceAfter: deduct.balanceAfter,
      // AI interpretation — surfaced to the UI so the user sees the value
      // (target segments, excluded competitor types, buyer persona).
      interpretation: interpretation
        ? {
            searchQuery: interpretation.searchQuery,
            targetSegments: interpretation.targetSegments,
            exclusions: interpretation.exclusions,
            buyerPersona: interpretation.buyerPersona,
            rationale: interpretation.rationale,
            model: interpretation.model,
          }
        : null,
    })
  } catch (error) {
    console.error('Prospection error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors du lancement de la campagne' },
      { status: 500 },
    )
  }
}
