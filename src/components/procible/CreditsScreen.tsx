'use client'

import { motion } from 'framer-motion'
import { useProcibleStore } from '@/store/procible-store'
import { ArrowLeft, Coins, Check, CreditCard } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

const creditPacks = [
  { id: 'small', credits: 10, price: '500 FCFA', popular: false, color: 'from-[#FF7B54] to-[#FFB347]' },
  { id: 'medium', credits: 30, price: '1 200 FCFA', popular: true, color: 'from-[#FF7B54] to-[#6C3FA9]' },
  { id: 'large', credits: 100, price: '3 500 FCFA', popular: false, color: 'from-[#6C3FA9] to-[#2EC4B6]' },
]

const paymentMethods = [
  { id: 'momo', label: 'Mobile Money', color: 'bg-[#FFB347]/10 text-[#FFB347]' },
  { id: 'orange', label: 'Orange Money', color: 'bg-[#FF7B54]/10 text-[#FF7B54]' },
  { id: 'mtn', label: 'MTN Money', color: 'bg-[#FFB347]/10 text-[#FFB347]' },
]

export default function CreditsScreen() {
  const { goBack, credits, setCredits, plan } = useProcibleStore()
  const [selectedPack, setSelectedPack] = useState<string>('medium')
  const [selectedMethod, setSelectedMethod] = useState<string>('momo')
  const [processing, setProcessing] = useState(false)

  const handlePurchase = async () => {
    setProcessing(true)
    // Simulate payment
    await new Promise(r => setTimeout(r, 1500))
    const pack = creditPacks.find(p => p.id === selectedPack)
    if (pack) {
      setCredits(credits + pack.credits)
      toast.success(`${pack.credits} crédits ajoutés !`)
    }
    setProcessing(false)
    goBack()
  }

  return (
    <div className="pb-28">
      {/* Header - sticky */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl px-5 pt-4 pb-4 flex items-center gap-3">
        <button onClick={goBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-secondary-foreground" />
        </button>
        <h1 className="text-lg font-bold">Crédits</h1>
      </div>

      <div className="px-5 mt-2">
        {/* Current balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="procible-gradient rounded-3xl p-6 mb-6 shadow-xl text-white relative overflow-hidden"
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-5 h-5 text-white/80" />
              <span className="text-white/80 text-sm">Solde actuel</span>
            </div>
            <p className="text-5xl font-bold mb-2">{credits}</p>
            <p className="text-white/80 text-sm">crédits disponibles · Plan {plan}</p>
          </div>
        </motion.div>

        {/* Credit packs */}
        <h2 className="text-base font-semibold mb-3">Choisissez un pack</h2>
        <div className="space-y-3 mb-6">
          {creditPacks.map((pack) => {
            const isSelected = selectedPack === pack.id
            return (
              <motion.button
                key={pack.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedPack(pack.id)}
                className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                  isSelected
                    ? 'border-[#FF7B54] bg-[#FF7B54]/5 shadow-md'
                    : 'border-border/50 bg-card'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pack.color} flex items-center justify-center shrink-0`}>
                  <Coins className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-lg">{pack.credits} crédits</p>
                  <p className="text-sm text-muted-foreground">{pack.price}</p>
                </div>
                {pack.popular && (
                  <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-[#6C3FA9]/10 text-[#6C3FA9]">Populaire</span>
                )}
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-[#FF7B54] flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Payment methods */}
        <h2 className="text-base font-semibold mb-3">Méthode de paiement</h2>
        <div className="grid grid-cols-3 gap-2 mb-6">
          {paymentMethods.map((method) => {
            const isSelected = selectedMethod === method.id
            return (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  isSelected ? 'border-[#FF7B54] bg-[#FF7B54]/5' : 'border-border/50 bg-card'
                }`}
              >
                <CreditCard className={`w-5 h-5 mx-auto mb-1 ${isSelected ? 'text-[#FF7B54]' : 'text-muted-foreground'}`} />
                <p className="text-[10px] font-medium">{method.label}</p>
              </button>
            )
          })}
        </div>

        {/* Purchase button */}
        <button
          onClick={handlePurchase}
          disabled={processing}
          className="w-full py-4 rounded-2xl procible-gradient text-white font-bold text-lg shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ minHeight: 56 }}
        >
          {processing ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Traitement...
            </>
          ) : (
            <>
              <Coins className="w-5 h-5" />
              Acheter maintenant
            </>
          )}
        </button>

        <p className="text-xs text-center text-muted-foreground mt-3">
          Paiement sécurisé · Activation immédiate
        </p>
      </div>
    </div>
  )
}
