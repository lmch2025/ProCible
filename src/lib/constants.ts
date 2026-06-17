/**
 * Shared constants for the ProCible CRM app.
 * Single source of truth for cities, sectors, etc.
 */

export const CITIES = [
  { id: 'douala', label: 'Douala', region: 'Littoral' },
  { id: 'yaounde', label: 'Yaoundé', region: 'Centre' },
  { id: 'bafoussam', label: 'Bafoussam', region: 'Ouest' },
  { id: 'garoua', label: 'Garoua', region: 'Nord' },
  { id: 'buea', label: 'Buea', region: 'Sud-Ouest' },
  { id: 'maroua', label: 'Maroua', region: 'Extrême-Nord' },
  { id: 'bamenda', label: 'Bamenda', region: 'Nord-Ouest' },
  { id: 'ebolowa', label: 'Ebolowa', region: 'Sud' },
  { id: 'douala-akwa', label: 'Akwa', region: 'Littoral' },
  { id: 'douala-bonapriso', label: 'Bonapriso', region: 'Littoral' },
  { id: 'douala-deido', label: 'Deido', region: 'Littoral' },
  { id: 'douala-bonamoussadi', label: 'Bonamoussadi', region: 'Littoral' },
  { id: 'yaounde-bastos', label: 'Bastos', region: 'Centre' },
  { id: 'yaounde-centre', label: 'Centre-Ville Yaoundé', region: 'Centre' },
  { id: 'yaounde-nlongkak', label: 'Nlongkak', region: 'Centre' },
  { id: 'bafoussam-centre', label: 'Centre-Ville Bafoussam', region: 'Ouest' },
] as const

export type CityId = typeof CITIES[number]['id']

export function getCityById(id: string) {
  return CITIES.find(c => c.id === id) ?? null
}

export function getCityLabel(id: string) {
  return getCityById(id)?.label ?? id
}

export function searchCities(query: string) {
  const q = query.toLowerCase().trim()
  if (!q) return []
  return CITIES.filter(c =>
    c.label.toLowerCase().includes(q) ||
    c.id.toLowerCase().includes(q) ||
    c.region.toLowerCase().includes(q)
  )
}
