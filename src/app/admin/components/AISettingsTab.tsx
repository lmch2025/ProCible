'use client'

import { useState, useEffect, useRef } from 'react'
import { Cpu, Zap, Coins, Shield, Check, Edit3, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { LoadingSkeleton, DetailRow, Badge, BottomSheet, SectionHeader } from './SharedComponents'

// Mirror of the 7-model rotation list actually used by `src/lib/ai-service.ts`.
// Keeping this in sync lets admins see exactly which models are tried in
// fallback order, and lets them pick the preferred default.
const AI_MODELS = [
  { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', name: 'Nemotron 3 Ultra 550B', size: '550B' },
  { id: 'openai/gpt-oss-120b:free', name: 'GPT-OSS 120B', size: '120B' },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free', name: 'Hermes 3 405B', size: '405B' },
  { id: 'qwen/qwen3-next-80b-a3b-instruct:free', name: 'Qwen3 Next 80B', size: '80B' },
  { id: 'google/gemma-4-31b-it:free', name: 'Gemma 4 31B', size: '31B' },
  { id: 'google/gemma-4-26b-a4b-it:free', name: 'Gemma 4 26B', size: '26B' },
  { id: 'openai/gpt-oss-20b:free', name: 'GPT-OSS 20B', size: '20B' },
]

export default function AISettingsTab() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [editKey, setEditKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const init = useRef(false)
  useEffect(() => {
    if (init.current) return
    init.current = true
    ;(async () => {
      try {
        const res = await fetch('/admin/api/settings')
        const data = await res.json()
        const map: Record<string, string> = {}
        ;(data.settings || []).forEach((s: any) => { map[s.key] = s.value })
        setSettings(map)
      } catch {}
      setLoading(false)
    })()
  }, [])

  const saveSetting = async (key: string, value: string) => {
    await fetch('/admin/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })
    await fetch('/admin/api/audit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', entity: 'settings', adminEmail: 'admin@procible.app', details: { key, value } }),
    })
    toast.success('Parametre sauvegarde')
    setEditKey(null)
    setSettings(s => ({ ...s, [key]: value }))
  }

  const aiSettingsDefs = [
    { key: 'ai_model_default', label: 'Modele par defaut', desc: 'Modele IA principal utilise pour les generations', icon: Cpu },
    { key: 'ai_fallback_model', label: 'Modele de secours', desc: 'Utilise si le modele principal echoue', icon: Shield },
    { key: 'ai_max_tokens', label: 'Max tokens', desc: 'Limite de tokens par reponse IA', icon: Zap },
    { key: 'ai_temperature', label: 'Temperature', desc: 'Creativite des reponses (0.0 - 2.0)', icon: Zap },
    { key: 'ai_cost_per_credit', label: 'Cout par credit IA', desc: 'Credits consommes par generation', icon: Coins },
  ]

  if (loading) return <LoadingSkeleton />

  return (
    <div className="p-4 space-y-4">
      <SectionHeader title="Configuration IA" subtitle="Modeles et parametres OpenRouter" />

      {/* API Key status */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${settings.openrouter_api_key ? 'bg-[#4CAF50]/10' : 'bg-[#FFB347]/10'}`}>
            <Shield className={`w-5 h-5 ${settings.openrouter_api_key ? 'text-[#4CAF50]' : 'text-[#FFB347]'}`} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">Cle API OpenRouter</p>
            <p className="text-xs text-gray-500">{settings.openrouter_api_key ? 'Configuree' : 'Non configuree'}</p>
          </div>
          <button onClick={() => { setEditKey('openrouter_api_key'); setEditValue(settings.openrouter_api_key || '') }} className="p-2 rounded-lg hover:bg-gray-100">
            <Edit3 className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Model Chain */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-gray-900">Chaîne de modèles (rotation)</h3>
          <Badge label={`${AI_MODELS.length} modèles`} color="bg-[#6C3FA9]/10 text-[#6C3FA9]" />
        </div>
        <p className="text-[11px] text-gray-500 mb-3 flex items-start gap-1.5">
          <Sparkles className="w-3 h-3 mt-0.5 shrink-0 text-[#FF7B54]" />
          Chaque requête IA essaie les modèles dans cet ordre. Si un modèle
          renvoie 429 (surcharge) ou 5xx, il est mis en pause 60s et le
          suivant prend le relais automatiquement.
        </p>
        <div className="space-y-2">
          {AI_MODELS.map((model, i) => (
            <div key={model.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#FF7B54] to-[#6C3FA9] flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{model.name}</p>
                <p className="text-[10px] text-gray-400 font-mono truncate">{model.id}</p>
              </div>
              <Badge label={model.size} color="bg-[#2EC4B6]/10 text-[#2EC4B6]" />
              {(settings.ai_model_default === model.id || (!settings.ai_model_default && i === 0)) && (
                <Badge label="Défaut" color="bg-[#FF7B54]/10 text-[#FF7B54]" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-2">
        {aiSettingsDefs.map(def => (
          <div key={def.key} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#6C3FA9]/10 flex items-center justify-center">
                <def.icon className="w-4 h-4 text-[#6C3FA9]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{def.label}</p>
                <p className="text-[10px] text-gray-500">{def.desc}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2 py-1 bg-gray-50 rounded-lg text-xs font-mono">{settings[def.key] || '—'}</span>
                <button onClick={() => { setEditKey(def.key); setEditValue(settings[def.key] || '') }} className="p-1.5 rounded-lg hover:bg-gray-100"><Edit3 className="w-3.5 h-3.5 text-gray-400" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit setting bottom sheet */}
      <BottomSheet open={!!editKey} onClose={() => setEditKey(null)} title={`Modifier: ${editKey || ''}`}>
        <div className="space-y-3">
          {editKey === 'ai_model_default' || editKey === 'ai_fallback_model' ? (
            <div className="space-y-2">
              {AI_MODELS.map(model => (
                <button
                  key={model.id}
                  onClick={() => { setEditValue(model.id) }}
                  className={`w-full p-3 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors ${editValue === model.id ? 'bg-[#FF7B54]/10 text-[#FF7B54] ring-2 ring-[#FF7B54]/30' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                >
                  <div className="flex-1 text-left">
                    <p>{model.name}</p>
                    <p className="text-[10px] font-mono opacity-60">{model.id}</p>
                  </div>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#2EC4B6]/10 text-[#2EC4B6]">
                    {model.size}
                  </span>
                  {editValue === model.id && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          ) : (
            <input value={editValue} onChange={e => setEditValue(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF7B54]/30" autoFocus />
          )}
          <button onClick={() => editKey && saveSetting(editKey, editValue)} className="w-full py-3 bg-[#FF7B54] text-white rounded-xl text-sm font-medium active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
            <Check className="w-4 h-4" />Sauvegarder
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
