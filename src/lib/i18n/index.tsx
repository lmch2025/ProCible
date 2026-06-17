'use client'

import React, { useSyncExternalStore, useCallback } from 'react'
import { dictionaries, type Locale, resolveKey, interpolate } from './dictionary'

/**
 * Storage layout
 * --------------
 *   procible.locale           — current effective locale ('fr' | 'en'), always present in the browser
 *   procible.locale.explicit  — present ONLY when the user has manually chosen a language
 *                                (via the language selector in Onboarding or Profile).
 *                                When this is absent, the app re-detects from the browser
 *                                on every load — so changing the phone/browser language
 *                                actually updates the app language.
 *
 * Why split into two keys?
 *   Previously, calling setLocale() wrote to `procible.locale`, and detectBrowserLocale()
 *   read that key first → once a user (or any code path) set it to 'fr', the browser
 *   language was ignored forever. The split lets us distinguish "user chose" from
 *   "auto-detected" and re-detect when no explicit choice exists.
 */
const STORAGE_KEY = 'procible.locale'
const EXPLICIT_KEY = 'procible.locale.explicit'
const DEFAULT_LOCALE: Locale = 'fr'

/** Event dispatched whenever the locale changes (so useSyncExternalStore re-renders). */
const LOCALE_CHANGE_EVENT = 'procible:locale-change'

export interface I18nContextValue {
  /** Current effective locale. */
  locale: Locale
  /** True when the locale was auto-detected (vs explicitly chosen by the user). */
  isAuto: boolean
  /** Explicitly set the locale and persist it as the user's choice. */
  setLocale: (locale: Locale) => void
  /** Toggle between 'fr' and 'en' (also marks as explicit). */
  toggleLocale: () => void
  /** Clear the explicit user choice and re-detect from the browser. */
  resetToAuto: () => void
  /** Plain-string translation. */
  t: (key: string, vars?: Record<string, string | number>) => string
  /** Plural-aware translation: picks `.one` or `.other` based on `count`. */
  tp: (key: string, count: number, vars?: Record<string, string | number>) => string
}

const I18nContext = React.createContext<I18nContextValue | null>(null)

/* -------------------------------------------------------------------------- */
/* Pure detection logic (shared by client + inline pre-hydration script)      */
/* -------------------------------------------------------------------------- */

/**
 * Detect the user's preferred locale, in this order:
 *  1. Explicit user choice (procible.locale.explicit) — set when the user clicks
 *     a language button in Onboarding/Profile.
 *  2. Browser preference (navigator.language / navigator.languages).
 *  3. Default French (the app's primary market is francophone Africa).
 *
 * Browser detection:
 *  - any language code starting with 'en' → English
 *  - any language code starting with 'fr' → French
 *  - everything else → falls through to French fallback
 */
export function detectBrowserLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE

  // 1. Explicit user choice — wins over everything
  try {
    const explicit = window.localStorage.getItem(EXPLICIT_KEY)
    if (explicit === 'fr' || explicit === 'en') return explicit
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

/**
 * Returns true when no explicit user choice exists (i.e. the locale is auto-detected
 * from the browser on every load). Used by the UI to show an "Auto" indicator.
 */
export function isLocaleAuto(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const explicit = window.localStorage.getItem(EXPLICIT_KEY)
    return explicit !== 'fr' && explicit !== 'en'
  } catch {
    return true
  }
}

/* -------------------------------------------------------------------------- */
/* useSyncExternalStore plumbing — proper SSR + hydration handling            */
/* -------------------------------------------------------------------------- */

/**
 * Server snapshot: always French. Used during SSR and during the very first
 * client hydration pass, so the markup matches what the server rendered.
 * (No hydration mismatch warnings.)
 */
function getServerSnapshot(): Locale {
  return DEFAULT_LOCALE
}

/**
 * Client snapshot: returns the locale that the inline pre-hydration script
 * (in layout.tsx <head>) wrote to localStorage. If the script hasn't run
 * (defensive), we compute it on the fly from the same detectBrowserLocale().
 */
function getClientSnapshot(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'fr' || stored === 'en') return stored
  } catch {
    // ignore
  }
  // Fallback: detect synchronously and persist for next time
  const detected = detectBrowserLocale()
  try {
    window.localStorage.setItem(STORAGE_KEY, detected)
  } catch {
    // ignore
  }
  return detected
}

/**
 * Subscribe to locale changes. Fires on:
 *  - `storage` events (other tabs changing localStorage)
 *  - Our custom `procible:locale-change` event (this tab, when setLocale runs)
 */
function subscribe(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener(LOCALE_CHANGE_EVENT, callback)
  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === EXPLICIT_KEY || e.key === null) {
      callback()
    }
  })
  return () => {
    window.removeEventListener(LOCALE_CHANGE_EVENT, callback)
  }
}

/* -------------------------------------------------------------------------- */
/* Provider                                                                   */
/* -------------------------------------------------------------------------- */

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // useSyncExternalStore handles the SSR/hydration boundary correctly:
  //  - During SSR: returns getServerSnapshot() → French
  //  - During client hydration: also returns getServerSnapshot() → matches SSR, no mismatch
  //  - Immediately after hydration: React re-renders with getClientSnapshot() → real locale
  const locale = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)

  // Whether the current locale is auto-detected (no explicit user choice)
  const isAuto = useSyncExternalStore(
    subscribe,
    () => isLocaleAuto(),
    () => true
  )

  // Persist locale to localStorage + set <html lang="..."> attribute
  const setLocale = useCallback((next: Locale) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
      // Mark as explicit so subsequent loads respect the user's choice
      window.localStorage.setItem(EXPLICIT_KEY, next)
    } catch {
      // ignore storage errors
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = next
    }
    // Notify subscribers (useSyncExternalStore will re-render)
    window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT))
  }, [])

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'fr' ? 'en' : 'fr')
  }, [locale, setLocale])

  /**
   * Clear the explicit user choice so subsequent loads re-detect from the browser.
   * Also immediately applies the newly-detected locale for the current session.
   */
  const resetToAuto = useCallback(() => {
    try {
      window.localStorage.removeItem(EXPLICIT_KEY)
    } catch {
      // ignore
    }
    const detected = detectBrowserLocale()
    try {
      window.localStorage.setItem(STORAGE_KEY, detected)
    } catch {
      // ignore
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = detected
    }
    window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT))
  }, [])

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

  return React.createElement(
    I18nContext.Provider,
    { value: { locale, isAuto, setLocale, toggleLocale, resetToAuto, t, tp } },
    children
  )
}

export function useI18n(): I18nContextValue {
  const ctx = React.useContext(I18nContext)
  if (!ctx) {
    // Defensive fallback (e.g. used outside provider during HMR)
    return {
      locale: DEFAULT_LOCALE,
      isAuto: true,
      setLocale: () => {},
      toggleLocale: () => {},
      resetToAuto: () => {},
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
  const { locale, isAuto, setLocale, toggleLocale, resetToAuto } = useI18n()
  return { locale, isAuto, setLocale, toggleLocale, resetToAuto }
}
