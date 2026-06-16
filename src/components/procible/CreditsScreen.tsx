'use client'

import { motion } from 'framer-motion'
import { useProcibleStore } from '@/store/procible-store'
import { ArrowLeft, Coins, Check, CreditCard, Receipt, Zap, TrendingUp, TrendingDown, Info } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface CreditTransaction {
  id: string
  amount: number
  balanceAfter: number
  action: string
  label: string
  note: string | null
  createdAt: string
}

interface CreditRule {
  action: string
  label: string
  cost: number
  description: string | null
  freeQuotaPerDay: number
  enabled: boolean
}

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
  const [view, setView] = useState<'main' | 'history' | 'pricing'>('main')
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [rules, setRules] = useState<CreditRule[]>([])

  // Load transaction history + rules on mount
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/credits')
        if (res.ok) {
          const data = await res.json()
          setTransactions(data.transactions || [])
          setRules(data.rules || [])
          if (typeof data.balance === 'number') setCredits(data.balance)
        }
      } catch {}
    })()
  }, [setCredits])

  const handlePurchase = async () => {
    setProcessing(true)
    // Simulate payment
    await new Promise(r => setTimeout(r, 1500))
    const pack = creditPacks.find(p => p.id === selectedPack)
    if (pack) {
      setCredits(credits + pack.credits)
      toast.success(`${pack.credits} crédits ajoutés !`)
      // Reload transactions to show the purchase
      try {
        const res = await fetch('/api/credits')
        if (res.ok) {
          const data = await res.json()
          setTransactions(data.transactions || [])
        }
      } catch {}
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

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <button
            onClick={() => setView('history')}
            className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm flex items-center gap-3 active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-[#6C3FA9]/10 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-[#6C3FA9]" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">Historique</p>
              <p className="text-[10px] text-muted-foreground">Voir les transactions</p>
            </div>
          </button>
          <button
            onClick={() => setView('pricing')}
            className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm flex items-center gap-3 active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-[#FF7B54]/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#FF7B54]" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">Tarification</p>
              <p className="text-[10px] text-muted-foreground">Coût des actions</p>
            </div>
          </button>
        </div>

        {view === 'main' && (
          <>
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
          </>
        )}

        {view === 'history' && (
          <TransactionHistory
            transactions={transactions}
            onBack={() => setView('main')}
          />
        )}

        {view === 'pricing' && (
          <PricingTable rules={rules} onBack={() => setView('main')} />
        )}
      </div>
    </div>
  )
}

function TransactionHistory({ transactions, onBack }: { transactions: CreditTransaction[]; onBack: () => void }) {
  const totalIn = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const totalOut = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)

  return (
    <div>
      <button onClick={onBack} className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
        <ArrowLeft className="w-3 h-3" />Retour
      </button>

      <h2 className="text-base font-semibold mb-3">Historique des transactions</h2>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-card rounded-2xl p-3 border border-border/50 shadow-sm">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-green-500" />Crédités
          </p>
          <p className="text-xl font-bold text-green-600">+{totalIn}</p>
        </div>
        <div className="bg-card rounded-2xl p-3 border border-border/50 shadow-sm">
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-red-500" />Débités
          </p>
          <p className="text-xl font-bold text-red-600">-{totalOut}</p>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 border border-border/50 text-center">
          <Receipt className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Aucune transaction pour l'instant</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map((t) => (
            <div key={t.id} className="bg-card rounded-2xl p-3 border border-border/50 shadow-sm flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${t.amount >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                {t.amount >= 0 ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{t.label}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {new Date(t.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  {t.note ? ` · ${t.note}` : ''}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`font-bold text-sm ${t.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {t.amount > 0 ? '+' : ''}{t.amount}
                </p>
                <p className="text-[9px] text-muted-foreground">solde: {t.balanceAfter}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PricingTable({ rules, onBack }: { rules: CreditRule[]; onBack: () => void }) {
  return (
    <div>
      <button onClick={onBack} className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
        <ArrowLeft className="w-3 h-3" />Retour
      </button>

      <h2 className="text-base font-semibold mb-1">Coût des actions</h2>
      <p className="text-xs text-muted-foreground mb-4 flex items-start gap-1.5">
        <Info className="w-3 h-3 mt-0.5 shrink-0" />
        Chaque action à valeur ajoutée consomme des crédits. Certaines ont un quota gratuit quotidien.
      </p>

      <div className="space-y-2">
        {rules.length === 0 ? (
          <div className="bg-card rounded-2xl p-8 border border-border/50 text-center">
            <Zap className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Aucune règle de tarification configurée</p>
          </div>
        ) : (
          rules.map((rule) => (
            <div key={rule.action} className="bg-card rounded-2xl p-4 border border-border/50 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF7B54] to-[#6C3FA9] flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm">{rule.label}</p>
                    <p className="font-bold text-sm text-[#FF7B54] shrink-0">
                      {rule.cost === 0 ? (
                        <span className="text-green-600">Gratuit</span>
                      ) : (
                        <span>{rule.cost} <span className="text-[10px] text-muted-foreground font-normal">crédits</span></span>
                      )}
                    </p>
                  </div>
                  {rule.description && <p className="text-xs text-muted-foreground mt-1">{rule.description}</p>}
                  {rule.freeQuotaPerDay > 0 && (
                    <p className="text-[10px] text-green-600 mt-1.5 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {rule.freeQuotaPerDay} premier(s) usage(s) gratuit(s) par jour
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
