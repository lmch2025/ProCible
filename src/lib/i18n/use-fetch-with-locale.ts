'use client'

/**
 * fetch() wrapper that automatically adds the `x-locale` header
 * with the user's currently selected UI language.
 *
 * Use this for any API call whose response contains user-facing strings
 * (error messages, notification titles/messages, etc.) so the backend
 * can localize them.
 *
 * Server side: import { getLocaleFromRequest, tServer } from '@/lib/i18n/server'
 */

import { useI18n } from './index'

export function useFetchWithLocale() {
  const { locale } = useI18n()

  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const headers = new Headers(init?.headers)
    if (!headers.has('x-locale')) {
      headers.set('x-locale', locale)
    }
    return fetch(input, { ...init, headers })
  }
}

/**
 * Build a Headers object with x-locale pre-set.
 * Use this when you need to pass headers to multiple fetches or compose with other headers.
 */
export function buildLocaleHeaders(locale: 'fr' | 'en', extra?: Record<string, string>): Headers {
  const headers = new Headers(extra)
  headers.set('x-locale', locale)
  return headers
}
