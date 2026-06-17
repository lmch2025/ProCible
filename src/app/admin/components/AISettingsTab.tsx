'use client'

import { useState, useEffect, useRef } from 'react'
import { Cpu, Zap, Coins, Shield, Check, Edit3, Sparkles, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { LoadingSkeleton, DetailRow, Badge, BottomSheet, SectionHeader } from './SharedComponents'
import { useI18n } from '@/lib/i18n'

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
  const { t } = useI18n()
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
    toast.success(t('admin.ai_settings.toast_saved'))
    setEditKey(null)
    setSettings(s => ({ ...s, [key]: value }))
  }

  const aiSettingsDefs = [
    { key: 'ai_model_default', labelKey: 'admin.ai_settings.setting_default_model', descKey: 'admin.ai_settings.setting_default_model_desc', icon: Cpu },
    { key: 'ai_fallback_model', labelKey: 'admin.ai_settings.setting_fallback_model', descKey: 'admin.ai_settings.setting_fallback_model_desc', icon: Shield },
    { key: 'ai_max_tokens', labelKey: 'admin.ai_settings.setting_max_tokens', descKey: 'admin.ai_settings.setting_max_tokens_desc', icon: Zap },
    { key: 'ai_temperature', labelKey: 'admin.ai_settings.setting_temperature', descKey: 'admin.ai_settings.setting_temperature_desc', icon: Zap },
    { key: 'ai_cost_per_credit', labelKey: 'admin.ai_settings.setting_cost_per_credit', descKey: 'admin.ai_settings.setting_cost_per_credit_desc', icon: Coins },
  ]

  if (loading) return <LoadingSkeleton />

  const hasApiKey = !!settings.openrouter_api_key

  return (
    <div className="p-4 space-y-4">
      <SectionHeader title={t('admin.ai_settings.title')} subtitle={t('admin.ai_settings.subtitle')} />

      {/* API Key status */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasApiKey ? 'bg-[#4CAF50]/10' : 'bg-[#FFB347]/10'}`}>
            <Shield className={`w-5 h-5 ${hasApiKey ? 'text-[#4CAF50]' : 'text-[#FFB347]'}`} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{t('admin.ai_settings.api_key_title')}</p>
            <p className="text-xs text-gray-500">
              {hasApiKey
                ? t('admin.ai_settings.api_key_configured')
                : t('admin.ai_settings.api_key_not_configured')}
            </p>
          </div>
          <button onClick={() => { setEditKey('openrouter_api_key'); setEditValue(settings.openrouter_api_key || '') }} className="p-2 rounded-lg hover:bg-gray-100">
            <Edit3 className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        {!hasApiKey && (
          <div className="mt-3 bg-[#FFB347]/5 rounded-xl p-3 border border-[#FFB347]/10 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[#FFB347] shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-600 leading-relaxed">
              {t('admin.ai_settings.api_key_warning')}
            </p>
          </div>
        )}
      </div>

      {/* Model Chain */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-gray-900">{t('admin.ai_settings.model_chain_title')}</h3>
          <Badge label={t('admin.ai_settings.models_count', { count: AI_MODELS.length })} color="bg-[#6C3FA9]/10 text-[#6C3FA9]" />
        </div>
        <p className="text-[11px] text-gray-500 mb-3 flex items-start gap-1.5">
          <Sparkles className="w-3 h-3 mt-0.5 shrink-0 text-[#FF7B54]" />
          {t('admin.ai_settings.model_chain_desc')}
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
                <Badge label={t('admin.ai_settings.default_badge')} color="bg-[#FF7B54]/10 text-[#FF7B54]" />
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
                <p className="text-sm font-semibold text-gray-900">{t(def.labelKey)}</p>
                <p className="text-[10px] text-gray-500">{t(def.descKey)}</p>
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
      <BottomSheet open={!!editKey} onClose={() => setEditKey(null)} title={t('admin.ai_settings.edit_title', { key: editKey || '' })}>
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
            <Check className="w-4 h-4" />{t('admin.ai_settings.save')}
          </button>
        </div>
      </BottomSheet>
    </div>
  )
}
