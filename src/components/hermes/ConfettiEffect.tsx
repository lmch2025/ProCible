'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useCallback } from 'react'

interface ConfettiPiece {
  id: number
  x: number
  color: string
  delay: number
  size: number
}

export default function ConfettiEffect() {
  const [pieces] = useState<ConfettiPiece[]>(() => {
    const colors = ['#FF7B54', '#6C3FA9', '#FFB347', '#2EC4B6', '#4CAF50', '#E4405F']
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
      size: Math.random() * 8 + 4,
    }))
  })

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      <AnimatePresence>
        {pieces.map((piece) => (
          <motion.div
            key={piece.id}
            initial={{
              x: `${piece.x}vw`,
              y: -20,
              opacity: 1,
              rotate: 0,
            }}
            animate={{
              y: '100vh',
              opacity: 0,
              rotate: Math.random() * 720 - 360,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1.5 + Math.random(),
              delay: piece.delay,
              ease: 'easeOut',
            }}
            className="absolute"
            style={{
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
