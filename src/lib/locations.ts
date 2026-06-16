/**
 * Hierarchical location support: country (any of the 250 worldwide ISO2 codes)
 * → city (looked up live via Nominatim through /api/cities).
 *
 * Format used in the DB column `locations`: comma-separated entries
 *   "ISO2:CityName"  → a specific city in that country
 *   "ISO2:all"       → the whole country
 *
 * The country list is no longer hardcoded — we use src/lib/all-countries.ts
 * which has all 250 world countries. French display names come from
 * Intl.DisplayNames (built into Node.js 14+ and all modern browsers).
 */

import { ALL_COUNTRIES, COUNTRY_BY_ISO, iso2ToFlag, countryNameFR } from './all-countries'

export { ALL_COUNTRIES, COUNTRY_BY_ISO, iso2ToFlag, countryNameFR }

export interface Country {
  iso2: string
  name: string
  dialCode: string
}

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
      out.push({
        iso2,
        country: countryNameFR(iso2, iso2),
        flag: iso2ToFlag(iso2),
        city: city === 'all' ? null : city || null,
        raw,
      })
      continue
    }
    out.push({
      iso2,
      country: countryNameFR(iso2, country.name),
      flag: iso2ToFlag(iso2),
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
