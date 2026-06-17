/**
 * Server-side i18n helpers for API routes.
 *
 * API routes can't use React hooks, so they call:
 *   const locale = getLocaleFromRequest(request)
 *   const message = tServer(locale, 'prospection.toast_insufficient', { balance: 2, required: 5 })
 *
 * Locale is resolved in this order:
 *  1. `x-locale` HTTP header (explicit client choice)
 *  2. `?lang=` query parameter
 *  3. `Accept-Language` header (browser preference)
 *  4. Default French
 */

import type { NextRequest } from 'next/server'
import { dictionaries, type Locale, resolveKey, interpolate } from './dictionary'

export const DEFAULT_LOCALE: Locale = 'fr'

export function getLocaleFromRequest(req: Request | NextRequest): Locale {
  // 1. Explicit header
  const headerLocale = req.headers.get('x-locale')
  if (headerLocale === 'fr' || headerLocale === 'en') return headerLocale

  // 2. Query param (only for NextRequest with .nextUrl)
  if ('nextUrl' in req && req.nextUrl) {
    const langParam = req.nextUrl.searchParams.get('lang')
    if (langParam === 'fr' || langParam === 'en') return langParam
  }

  // 3. Accept-Language
  const accept = req.headers.get('accept-language')
  if (accept) {
    // Parse "en-US,en;q=0.9,fr;q=0.8" → pick highest-q language we support
    const parts = accept.split(',').map(p => p.trim().split(';')[0].toLowerCase())
    for (const p of parts) {
      if (p.startsWith('en')) return 'en'
      if (p.startsWith('fr')) return 'fr'
    }
  }

  return DEFAULT_LOCALE
}

/**
 * Server-side translation with the same semantics as the client `t()`:
 *  - Resolves dot-path keys
 *  - Falls back to French if missing in requested locale
 *  - Returns the key itself if nothing found
 */
export function tServer(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>
): string {
  const dict = dictionaries[locale]
  const value = resolveKey(dict, key)
  if (typeof value === 'string') {
    return interpolate(value, vars)
  }
  if (locale !== 'fr') {
    const frValue = resolveKey(dictionaries.fr, key)
    if (typeof frValue === 'string') {
      return interpolate(frValue, vars)
    }
  }
  return key
}

/**
 * Plural-aware server translation.
 */
export function tServerP(
  locale: Locale,
  key: string,
  count: number,
  vars?: Record<string, string | number>
): string {
  const dict = dictionaries[locale]
  const value = resolveKey(dict, key)
  if (value && typeof value === 'object' && 'one' in (value as Record<string, unknown>) && 'other' in (value as Record<string, unknown>)) {
    const pluralObj = value as { one: string; other: string }
    const template = count === 1 ? pluralObj.one : pluralObj.other
    return interpolate(template, { ...vars, count })
  }
  if (locale !== 'fr') {
    const frValue = resolveKey(dictionaries.fr, key)
    if (frValue && typeof frValue === 'object' && 'one' in (frValue as Record<string, unknown>) && 'other' in (frValue as Record<string, unknown>)) {
      const pluralObj = frValue as { one: string; other: string }
      const template = count === 1 ? pluralObj.one : pluralObj.other
      return interpolate(template, { ...vars, count })
    }
  }
  if (typeof value === 'string') {
    return interpolate(value, { ...vars, count })
  }
  return key
}

/**
 * Build the standard localized error response for an API route.
 * Returns a Response with JSON `{ error: <message>, errorKey: <key> }`.
 *
 * Client side, components can prefer `errorKey` for re-localization,
 * or fall back to `error` which is already localized server-side.
 */
export function localizedErrorResponse(
  locale: Locale,
  key: string,
  vars: Record<string, string | number>,
  status: number = 400
): Response {
  const message = tServer(locale, key, vars)
  return new Response(
    JSON.stringify({ error: message, errorKey: key, vars }),
    { status, headers: { 'Content-Type': 'application/json' } }
  )
}
