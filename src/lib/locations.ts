/**
 * Hierarchical location list: country (ISO2 + name + flag) → cities.
 *
 * Focused on Central/West Africa (the app's primary market) with a smaller
 * set of major cities per country. The form lets the user either pick
 * "Tout le pays" (whole country) or drill down and pick one or more cities
 * across multiple countries.
 *
 * Format used in DB column `locations`: comma-separated entries
 * "ISO2:CityName" — example "CM:Douala,CM:Yaounde,SN::all"
 *   - The ":all" sentinel means "whole country".
 *   - Empty city after the colon is invalid (use ":all" instead).
 */

export interface Country {
  iso2: string
  name: string
  flag: string
  dialCode: string
  cities: string[]
}

export const COUNTRIES: Country[] = [
  {
    iso2: 'CM',
    name: 'Cameroun',
    flag: '🇨🇲',
    dialCode: '+237',
    cities: ['Douala', 'Yaoundé', 'Bafoussam', 'Garoua', 'Bamenda', 'Maroua', 'Buea', 'Ebolowa', 'Kribi', 'Limbé', 'Ngaoundéré', 'Bertoua', 'Loum', 'Nkongsamba', 'Edéa'],
  },
  {
    iso2: 'CI',
    name: "Côte d'Ivoire",
    flag: '🇨🇮',
    dialCode: '+225',
    cities: ['Abidjan', 'Bouaké', 'Yamoussoukro', 'Daloa', 'Korhogo', 'San-Pédro', 'Man', 'Divo', 'Gagnoa'],
  },
  {
    iso2: 'SN',
    name: 'Sénégal',
    flag: '🇸🇳',
    dialCode: '+221',
    cities: ['Dakar', 'Thiès', 'Saint-Louis', 'Touba', 'Ziguinchor', 'Rufisque', 'Kaolack', 'Mbour'],
  },
  {
    iso2: 'GA',
    name: 'Gabon',
    flag: '🇬🇦',
    dialCode: '+241',
    cities: ['Libreville', 'Port-Gentil', 'Franceville', 'Oyem', 'Moanda'],
  },
  {
    iso2: 'CG',
    name: 'Congo',
    flag: '🇨🇬',
    dialCode: '+242',
    cities: ['Brazzaville', 'Pointe-Noire', 'Dolisie', 'Nkayi', 'Owando'],
  },
  {
    iso2: 'CD',
    name: 'RD Congo',
    flag: '🇨🇩',
    dialCode: '+243',
    cities: ['Kinshasa', 'Lubumbashi', 'Goma', 'Mbuji-Mayi', 'Bukavu', 'Kananga', 'Kisangani'],
  },
  {
    iso2: 'TG',
    name: 'Togo',
    flag: '🇹🇬',
    dialCode: '+228',
    cities: ['Lomé', 'Sokodé', 'Kara', 'Atakpamé', 'Dapaong'],
  },
  {
    iso2: 'BJ',
    name: 'Bénin',
    flag: '🇧🇯',
    dialCode: '+229',
    cities: ['Cotonou', 'Porto-Novo', 'Parakou', 'Abomey', 'Natitingou'],
  },
  {
    iso2: 'BF',
    name: 'Burkina Faso',
    flag: '🇧🇫',
    dialCode: '+226',
    cities: ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Banfora', 'Ouahigouya'],
  },
  {
    iso2: 'ML',
    name: 'Mali',
    flag: '🇲🇱',
    dialCode: '+223',
    cities: ['Bamako', 'Sikasso', 'Ségou', 'Mopti', 'Kayes'],
  },
  {
    iso2: 'GN',
    name: 'Guinée',
    flag: '🇬🇳',
    dialCode: '+224',
    cities: ['Conakry', 'Nzérékoré', 'Kankan', 'Kindia', 'Labé'],
  },
  {
    iso2: 'FR',
    name: 'France',
    flag: '🇫🇷',
    dialCode: '+33',
    cities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Bordeaux', 'Lille', 'Nantes', 'Nice'],
  },
  {
    iso2: 'BE',
    name: 'Belgique',
    flag: '🇧🇪',
    dialCode: '+32',
    cities: ['Bruxelles', 'Anvers', 'Gand', 'Liège', 'Charleroi'],
  },
]

export const COUNTRY_BY_ISO: Record<string, Country> = Object.fromEntries(
  COUNTRIES.map((c) => [c.iso2, c]),
)

/** Parse "ISO2:City" entries (or "ISO2:all") into structured objects. */
export interface ParsedLocation {
  iso2: string
  country: string
  flag: string
  city: string | null // null when whole country selected
  raw: string
}

export function parseLocations(locations: string): ParsedLocation[] {
  if (!locations) return []
  const seen = new Set<string>()
  const out: ParsedLocation[] = []
  for (const raw of locations.split(',').map((s) => s.trim()).filter(Boolean)) {
    if (seen.has(raw)) continue
    seen.add(raw)
    const [iso2, city] = raw.split(':')
    const country = COUNTRY_BY_ISO[iso2]
    if (!country) {
      // Unknown country code — still surface it so admins can see it.
      out.push({ iso2, country: iso2, flag: '', city: city === 'all' ? null : city || null, raw })
      continue
    }
    out.push({
      iso2,
      country: country.name,
      flag: country.flag,
      city: city === 'all' ? null : city || null,
      raw,
    })
  }
  return out
}

/** Human-readable summary: "🇨🇲 Douala, Yaoundé + 🇸🇳 tout le pays". */
export function formatLocations(locations: string): string {
  const parsed = parseLocations(locations)
  if (parsed.length === 0) return '—'
  const byCountry = new Map<string, ParsedLocation[]>()
  for (const p of parsed) {
    const key = p.iso2
    if (!byCountry.has(key)) byCountry.set(key, [])
    byCountry.get(key)!.push(p)
  }
  const parts: string[] = []
  for (const [, items] of byCountry) {
    const flag = items[0].flag ? `${items[0].flag} ` : ''
    const countryName = items[0].country
    const allCities = items.filter((i) => i.city === null)
    const someCities = items.filter((i) => i.city !== null)
    if (allCities.length > 0 && someCities.length === 0) {
      parts.push(`${flag}Tout ${countryName}`)
    } else if (someCities.length > 0) {
      const cityNames = someCities.map((i) => i.city).join(', ')
      if (allCities.length > 0) parts.push(`${flag}${cityNames} + tout ${countryName}`)
      else parts.push(`${flag}${cityNames}`)
    }
  }
  return parts.join(' + ')
}

/** Count distinct locations — used for credit cost estimation. */
export function countLocations(locations: string): number {
  return parseLocations(locations).length
}
