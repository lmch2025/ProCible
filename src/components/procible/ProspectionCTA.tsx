'use client'

import { motion } from 'framer-motion'
import { useProcibleStore } from '@/store/procible-store'
import { Plus, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

/**
 * ProspectionCTA — sticky "Nouvelle recherche" button.
 *
 * Behavior:
 *  - Placed inline RIGHT AFTER the screen's sticky header.
 *  - Dynamically measures the previous sibling (the header) on mount + on
 *    resize, and uses that height as its `top` sticky offset. This way the
 *    CTA always pins exactly below the header regardless of the screen's
 *    header height (Home ≈ 88px, Leads ≈ 148px because of tabs, etc.).
 *  - When the user scrolls, the header pins to top:0 and the CTA pins to
 *    top:[headerHeight]px — staying visible while everything else on the
 *    page scrolls under the header.
 *  - Continuous gentle float + glow halo + shimmer streak for a "live" feel.
 *  - Click → opens the ProspectionForm bottom sheet.
 *
 * Usage: drop <ProspectionCTA /> right after the sticky header inside any
 * screen. No props needed.
 */
export default function ProspectionCTA() {
  const { setShowProspectionForm, prospectionSubmitting } = useProcibleStore()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [headerHeight, setHeaderHeight] = useState<number>(88) // safe default

  // Measure the previous sibling (the screen's sticky header) so we can pin
  // the CTA exactly below it.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const prev = el.previousElementSibling as HTMLElement | null
    if (!prev) return

    const measure = () => {
      const h = prev.getBoundingClientRect().height
      if (h > 0) setHeaderHeight(h)
    }
    measure()

    const ro = new ResizeObserver(measure)
    ro.observe(prev)
    return () => ro.disconnect()
  }, [])

  const handleClick = () => {
    if (!prospectionSubmitting) setShowProspectionForm(true)
  }

  return (
    <div
      ref={wrapRef}
      className="sticky z-30 px-4 pt-1.5 pb-1.5 bg-gradient-to-b from-background via-background/95 to-transparent"
      style={{ top: headerHeight ? `${headerHeight - 1}px` : 0 }}
    >
      <motion.button
        onClick={handleClick}
        whileTap={{ scale: 0.97 }}
        animate={{
          y: [0, -2, 0], // gentle float
        }}
        transition={{
          y: {
            duration: 3.5,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
        className="group relative w-full h-12 rounded-full procible-gradient shadow-lg shadow-[#FF7B54]/30 overflow-hidden"
        aria-label="Lancer une nouvelle recherche de clients"
      >
        {/* Glow halo */}
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FF7B54]/40 to-[#6C3FA9]/40 blur-lg opacity-60 group-hover:opacity-90 transition-opacity"
        />
        {/* Animated shimmer streak */}
        <span
          aria-hidden
          className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
        >
          <motion.span
            className="absolute -inset-y-2 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ['0%', '450%'] }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              ease: 'easeInOut',
              repeatDelay: 1.4,
            }}
          />
        </span>
        {/* Button content */}
        <span className="relative flex items-center justify-center gap-2.5 h-full">
          <motion.span
            className="flex items-center justify-center w-7 h-7 rounded-full bg-white/25 backdrop-blur-sm shrink-0"
            animate={{ rotate: [0, 90, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Plus className="w-4 h-4 text-white" strokeWidth={3} />
          </motion.span>
          <span className="flex items-center gap-1.5 font-bold text-white text-sm">
            Nouvelle recherche
            <Sparkles className="w-3.5 h-3.5 text-white/80" />
          </span>
        </span>
      </motion.button>
    </div>
  )
}
