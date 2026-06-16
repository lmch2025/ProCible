import { NextResponse } from 'next/server'
import { db, withDbFallback } from '@/lib/db'
import { parseLocations, countLocations } from '@/lib/locations'

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
      return NextResponse.json({ error: 'Échec création campagne' }, { status: 500 })
    }

    // Generate leads: ~5–15 per location entry. Skip per-city when "all country"
    // is selected — generate more leads per country with random cities.
    const createdLeads: any[] = []
    for (const loc of parsed) {
      let citiesForThisLoc: { iso2: string; city: string }[] = []
      if (loc.city === null) {
        // Whole country — use up to 3 representative cities
        const allCities = (await import('@/lib/locations')).COUNTRY_BY_ISO[loc.iso2]?.cities || []
        const sample = allCities.slice(0, 3)
        citiesForThisLoc = sample.map((c) => ({ iso2: loc.iso2, city: c }))
        if (citiesForThisLoc.length === 0) citiesForThisLoc = [{ iso2: loc.iso2, city: loc.country }]
      } else {
        citiesForThisLoc = [{ iso2: loc.iso2, city: loc.city }]
      }

      for (const { iso2, city } of citiesForThisLoc) {
        const leadCount = loc.city === null ? 4 + Math.floor(Math.random() * 4) : 3 + Math.floor(Math.random() * 5)
        for (let i = 0; i < leadCount; i++) {
          const data = JSON.parse(leadNameFromLocation(iso2, city, i))
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
                score: data.score,
                notes: data.notes,
                userId: finalUserId,
              },
            }),
            null as any,
          )
          if (lead) createdLeads.push(lead)
        }
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

    // Log audit
    await withDbFallback(
      (client) => client.auditLog.create({
        data: {
          action: 'create',
          entity: 'campaign',
          entityId: campaign.id,
          adminEmail: 'system@procible.app',
          details: JSON.stringify({ productName: productName.trim(), locations, leadsFound: createdLeads.length }),
        },
      }),
      null as any,
    )

    // Create a notification for the user
    await withDbFallback(
      (client) => client.notification.create({
        data: {
          userId: finalUserId,
          type: 'new_leads',
          title: 'Nouvelle campagne lancée',
          message: `${createdLeads.length} nouveaux clients potentiels trouvés pour « ${productName.trim()} » (${countLocations(locations)} zone(s)).`,
          read: false,
        },
      }),
      null as any,
    )

    return NextResponse.json({
      campaign: { ...campaign, leadsFound: createdLeads.length },
      leadsFound: createdLeads.length,
      leads: createdLeads.slice(0, 10), // return first 10 for instant UI feedback
    })
  } catch (error) {
    console.error('Prospection error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors du lancement de la campagne' },
      { status: 500 },
    )
  }
}
