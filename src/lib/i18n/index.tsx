'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { dictionaries, type Locale, resolveKey, interpolate } from './dictionary'

const STORAGE_KEY = 'procible.locale'
const DEFAULT_LOCALE: Locale = 'fr'

export interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  toggleLocale: () => void
  t: (key: string, vars?: Record<string, string | number>) => string
  /** Plural-aware t: picks `.one` or `.other` based on `count`. */
  tp: (key: string, count: number, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

/**
 * Detect the user's preferred locale, in this order:
 * 1. localStorage (explicit user choice from a previous session)
 * 2. navigator.language / navigator.languages (browser preference)
 * 3. Default French (fallback)
 *
 * Browser detection logic:
 *  - If the user's primary language code starts with 'en' → English
 *  - Everything else → French (the app's primary market is francophone Africa)
 */
export function detectBrowserLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE

  // 1. Explicit user choice
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'fr' || stored === 'en') return stored
  } catch {
    // localStorage may be unavailable (private mode / cookie blocked)
  }

  // 2. Browser preference
  const nav = window.navigator
  const langs = nav?.languages?.length ? nav.languages : [nav?.language].filter(Boolean)
  for (const lang of langs) {
    if (typeof lang !== 'string') continue
    const lower = lang.toLowerCase()
    if (lower.startsWith('en')) return 'en'
    if (lower.startsWith('fr')) return 'fr'
  }

  // 3. Fallback
  return DEFAULT_LOCALE
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  // On mount: detect locale (client-side only).
  // Suppressed: set-state-in-effect is intentional here — we MUST read
  // window.localStorage + navigator.language after mount (SSR-safe), and the
  // resulting re-render is exactly one extra pass on first paint only.
  useEffect(() => {
    const detected = detectBrowserLocale()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocaleState(detected)
  }, [])

  // Persist locale to localStorage + set <html lang="..."> attribute
  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore storage errors
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = next
    }
  }, [])

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'fr' ? 'en' : 'fr')
  }, [locale, setLocale])

  // Keep <html lang> in sync with current locale
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale
    }
  }, [locale])

  const t = useCallback((key: string, vars?: Record<string, string | number>): string => {
    const dict = dictionaries[locale]
    const value = resolveKey(dict, key)
    if (typeof value === 'string') {
      return interpolate(value, vars)
    }
    // Fallback to French if missing in current locale
    if (locale !== 'fr') {
      const frValue = resolveKey(dictionaries.fr, key)
      if (typeof frValue === 'string') {
        return interpolate(frValue, vars)
      }
    }
    // Last resort: return the key itself (visible to devs as a missing-translation marker)
    return key
  }, [locale])

  const tp = useCallback((key: string, count: number, vars?: Record<string, string | number>): string => {
    const dict = dictionaries[locale]
    const value = resolveKey(dict, key)
    if (value && typeof value === 'object' && 'one' in (value as Record<string, unknown>) && 'other' in (value as Record<string, unknown>)) {
      const pluralObj = value as { one: string; other: string }
      const template = count === 1 ? pluralObj.one : pluralObj.other
      return interpolate(template, { ...vars, count })
    }
    // Fallback: try French plural
    if (locale !== 'fr') {
      const frValue = resolveKey(dictionaries.fr, key)
      if (frValue && typeof frValue === 'object' && 'one' in (frValue as Record<string, unknown>) && 'other' in (frValue as Record<string, unknown>)) {
        const pluralObj = frValue as { one: string; other: string }
        const template = count === 1 ? pluralObj.one : pluralObj.other
        return interpolate(template, { ...vars, count })
      }
    }
    // If the key resolves directly to a string (no plural variant), interpolate count if needed
    if (typeof value === 'string') {
      return interpolate(value, { ...vars, count })
    }
    return key
  }, [locale])

  return React.createElement(I18nContext.Provider, { value: { locale, setLocale, toggleLocale, t, tp } }, children)
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    // Defensive fallback (e.g. used outside provider during HMR)
    return {
      locale: DEFAULT_LOCALE,
      setLocale: () => {},
      toggleLocale: () => {},
      t: (key: string) => key,
      tp: (key: string) => key,
    }
  }
  return ctx
}

/** Convenience hook returning just the `t` function. */
export function useT() {
  return useI18n().t
}

/** Convenience hook returning just the locale + setters. */
export function useLocale() {
  const { locale, setLocale, toggleLocale } = useI18n()
  return { locale, setLocale, toggleLocale }
}
