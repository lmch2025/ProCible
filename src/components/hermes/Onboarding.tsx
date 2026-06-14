'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useHermesStore } from '@/store/hermes-store'
import { Phone, Sparkles, Moon } from 'lucide-react'

const slides = [
  {
    icon: Sparkles,
    title: 'Bienvenue',
    subtitle: 'Hermes',
    description: 'Votre assistant personnel de prospection. Il trouve des clients pour vous, chaque nuit.',
    gradient: 'from-[#FF7B54] to-[#FFB347]',
    bgGradient: 'from-orange-50 to-amber-50',
  },
  {
    icon: Phone,
    title: 'Dis-nous qui tu cherches',
    subtitle: 'Vos préférences',
    description: 'Secteur, ville, type d\'entreprise... Dites-nous et Hermes fera le reste.',
    gradient: 'from-[#FF7B54] to-[#6C3FA9]',
    bgGradient: 'from-orange-50 to-purple-50',
  },
  {
    icon: Moon,
    title: 'Hermes travaille pour toi cette nuit',
    subtitle: 'Prêt ?',
    description: 'Pendant que vous dormez, Hermes cherche. Le matin, vos prospects sont là.',
    gradient: 'from-[#6C3FA9] to-[#2EC4B6]',
    bgGradient: 'from-purple-50 to-teal-50',
  },
]

export default function Onboarding() {
  const { onboardingStep, setOnboardingStep, completeOnboarding, setAuthenticated } = useHermesStore()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [showCodeInput, setShowCodeInput] = useState(false)
  const [codeSent, setCodeSent] = useState(false)

  const currentSlide = slides[onboardingStep] ?? slides[0]

  const handleSendCode = () => {
    if (phone.length >= 8) {
      setShowCodeInput(true)
      setCodeSent(true)
    }
  }

  const handleVerifyCode = () => {
    if (code.length === 4) {
      setAuthenticated(phone, 'demo-user')
      completeOnboarding()
    }
  }

  const handleNext = () => {
    if (onboardingStep < 2) {
      setOnboardingStep(onboardingStep + 1)
    }
  }

  const handleSkip = () => {
    setAuthenticated('+237600000000', 'demo-user')
    completeOnboarding()
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${currentSlide.bgGradient} transition-all duration-700`} />

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={onboardingStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="flex flex-col items-center text-center max-w-sm"
          >
            {/* Animated icon circle */}
            <motion.div
              className={`w-32 h-32 rounded-full bg-gradient-to-br ${currentSlide.gradient} flex items-center justify-center mb-8 shadow-lg`}
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <currentSlide.icon className="w-14 h-14 text-white" strokeWidth={1.5} />
            </motion.div>

            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">
              {currentSlide.subtitle}
            </h2>
            <h1 className="text-3xl font-bold text-foreground mb-4">
              {currentSlide.title}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {currentSlide.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom action area */}
      <div className="relative z-10 px-6 pb-12">
        {/* Phone input on step 2 */}
        {onboardingStep === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 space-y-4"
          >
            {!showCodeInput ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur rounded-2xl px-4 py-3 shadow-sm border border-white/50">
                  <Phone className="w-5 h-5 text-[#FF7B54]" />
                  <input
                    type="tel"
                    placeholder="Votre numéro"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-lg placeholder:text-muted-foreground/50"
                    maxLength={15}
                  />
                </div>
                <button
                  onClick={handleSendCode}
                  disabled={phone.length < 8}
                  className="w-full py-4 rounded-2xl hermes-gradient text-white font-semibold text-lg disabled:opacity-40 transition-all active:scale-[0.98]"
                >
                  Recevoir le code
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-center text-sm text-muted-foreground">
                  {codeSent ? 'Code envoyé !' : 'Entrez le code 4 chiffres'}
                </p>
                <div className="flex justify-center gap-3">
                  {[0, 1, 2, 3].map((i) => (
                    <input
                      key={i}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={code[i] || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '')
                        const newCode = code.split('')
                        newCode[i] = val
                        setCode(newCode.join(''))
                        // Auto-focus next
                        if (val && i < 3) {
                          const next = e.target.nextElementSibling as HTMLInputElement
                          next?.focus()
                        }
                      }}
                      className="w-14 h-14 text-center text-2xl font-bold rounded-xl bg-white/80 backdrop-blur border-2 border-[#FF7B54]/30 focus:border-[#FF7B54] outline-none shadow-sm transition-colors"
                    />
                  ))}
                </div>
                <button
                  onClick={handleVerifyCode}
                  disabled={code.length < 4}
                  className="w-full py-4 rounded-2xl hermes-gradient text-white font-semibold text-lg disabled:opacity-40 transition-all active:scale-[0.98]"
                >
                  Vérifier
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Step indicators */}
        <div className="flex justify-center gap-2 mb-6">
          {slides.map((_, i) => (
            <motion.div
              key={i}
              className="h-2 rounded-full"
              animate={{
                width: i === onboardingStep ? 24 : 8,
                backgroundColor: i === onboardingStep ? '#FF7B54' : '#FF7B5433',
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3">
          {onboardingStep < 2 ? (
            <>
              <button
                onClick={handleSkip}
                className="flex-1 py-4 rounded-2xl bg-white/60 backdrop-blur text-muted-foreground font-semibold text-lg border border-white/50 transition-all active:scale-[0.98]"
              >
                Passer
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-4 rounded-2xl hermes-gradient text-white font-semibold text-lg shadow-lg transition-all active:scale-[0.98]"
              >
                Suivant
              </button>
            </>
          ) : (
            <button
              onClick={handleSkip}
              className="flex-1 py-4 rounded-2xl bg-white/60 backdrop-blur text-muted-foreground font-semibold text-lg border border-white/50 transition-all active:scale-[0.98]"
            >
              Mode demo
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
