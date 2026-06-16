import { NextResponse } from 'next/server'

/**
 * GET /api/cities?q=<query>&country=<ISO2>&limit=<n>
 *
 * Server-side proxy for OpenStreetMap Nominatim city search.
 *
 * Why a proxy?
 *  - Adds the required User-Agent header (Nominatim usage policy).
 *  - Avoids CORS issues from the browser.
 *  - Caches responses in memory for 24h (Nominatim asks for max 1 req/sec).
 *  - Normalizes the response into a compact shape the form can render.
 *
 * The cache is per-process (works perfectly on Vercel serverless — each
 * cold start has its own short-lived cache, which matches Nominatim's
 * rate-limit expectations).
 */

interface CachedEntry {
  at: number
  data: any
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24h
const cache = new Map<string, CachedEntry>()

// Allowed types from Nominatim that we treat as a city/town.
const ALLOWED_ADDRESSTYPES = new Set([
  'city',
  'town',
  'village',
  'municipality',
  'county',
  'hamlet',
])

interface CitySuggestion {
  name: string
  country: string // ISO2 lowercase
  countryName: string
  state?: string
  county?: string
  lat: string
  lon: string
  raw: string // display_name
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()
    const country = (searchParams.get('country') || '').trim().toLowerCase()
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20)

    if (q.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    const cacheKey = `${q.toLowerCase()}|${country}|${limit}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return NextResponse.json(cached.data)
    }

    // Build Nominatim URL
    const params = new URLSearchParams({
      format: 'json',
      q,
      addressdetails: '1',
      limit: String(limit * 2), // over-fetch then filter
      'accept-language': 'fr', // prefer French names
    })
    if (country && country.length === 2) {
      params.set('countrycodes', country)
    }

    const url = `https://nominatim.openstreetmap.org/search?${params.toString()}`
    const res = await fetch(url, {
      headers: {
        // Nominatim requires a valid User-Agent identifying the app.
        'User-Agent': 'ProCible/1.0 (contact@procible.app)',
        'Accept': 'application/json',
      },
      // Don't cache at the fetch layer — we manage our own cache.
      cache: 'no-store',
    })

    if (!res.ok) {
      console.error('Nominatim error', res.status, await res.text().catch(() => ''))
      return NextResponse.json(
        { suggestions: [], error: 'geocoder_unavailable' },
        { status: 200 }, // 200 with empty list — form stays responsive
      )
    }

    const raw: any[] = await res.json()

    // Filter to keep only city-like results and dedupe by name.
    const seen = new Set<string>()
    const suggestions: CitySuggestion[] = []
    for (const r of raw) {
      const at = r.addresstype || r.type
      if (!ALLOWED_ADDRESSTYPES.has(at)) continue
      const name = r.name || r.address?.[at] || r.address?.city || r.address?.town
      if (!name) continue
      const cc = (r.address?.country_code || country || '').toLowerCase()
      if (!cc) continue
      const key = `${name.toLowerCase()}|${cc}`
      if (seen.has(key)) continue
      seen.add(key)
      suggestions.push({
        name,
        country: cc,
        countryName: r.address?.country || '',
        state: r.address?.state,
        county: r.address?.county,
        lat: r.lat,
        lon: r.lon,
        raw: r.display_name,
      })
      if (suggestions.length >= limit) break
    }

    const payload = { suggestions, count: suggestions.length }
    cache.set(cacheKey, { at: Date.now(), data: payload })
    return NextResponse.json(payload)
  } catch (error) {
    console.error('Cities API error:', error)
    return NextResponse.json(
      { suggestions: [], error: 'internal_error' },
      { status: 200 },
    )
  }
}
