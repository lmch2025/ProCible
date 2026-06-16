'use client'

import { motion } from 'framer-motion'

export function SkeletonCard() {
  return (
    <div className="bg-card rounded-3xl shadow-lg border border-border/30 overflow-hidden p-6">
      <div className="flex items-start gap-4 mb-5">
        <div className="w-16 h-16 rounded-2xl skeleton-shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/4 rounded-lg skeleton-shimmer" />
          <div className="h-4 w-1/2 rounded-lg skeleton-shimmer" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-6 w-1/3 rounded-lg skeleton-shimmer" />
        <div className="h-4 w-2/3 rounded-lg skeleton-shimmer" />
        <div className="h-3 w-1/2 rounded-lg skeleton-shimmer" />
      </div>
      <div className="mt-4 flex justify-between">
        <div className="h-6 w-16 rounded-full skeleton-shimmer" />
        <div className="h-8 w-8 rounded-full skeleton-shimmer" />
      </div>
    </div>
  )
}

export function SkeletonLeadList() {
  return (
    <div className="space-y-4 px-5 py-4">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <div className="flex items-center gap-3 bg-card rounded-2xl p-4 border border-border/50">
            <div className="w-10 h-10 rounded-full skeleton-shimmer" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 rounded skeleton-shimmer" />
              <div className="h-3 w-1/2 rounded skeleton-shimmer" />
            </div>
            <div className="h-5 w-10 rounded-full skeleton-shimmer" />
          </div>
        </motion.div>
      ))}
    </div>
  )
}
