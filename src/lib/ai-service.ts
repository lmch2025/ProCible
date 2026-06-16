/**
 * OpenRouter AI Service — 7 free models with smart rotation + cooldown.
 *
 * User-requested model list (Dec 2024):
 *   1. nvidia/nemotron-3-ultra-550b-a55b:free
 *   2. openai/gpt-oss-120b:free
 *   3. openai/gpt-oss-20b:free
 *   4. google/gemma-4-31b-it:free
 *   5. google/gemma-4-26b-a4b-it:free
 *   6. qwen/qwen3-next-80b-a3b-instruct:free
 *   7. nousresearch/hermes-3-llama-3.1-405b:free
 *
 * Rotation strategy:
 *   - On each call, we iterate models in their declared order.
 *   - If a model returns 429 (rate limit) or 5xx (overloaded), we mark it
 *     as "cooling down" for 60 seconds and immediately try the next.
 *   - If a model returns 200 but empty/malformed content, we try the next
 *     without cooldown (transient issue).
 *   - If all models fail, we fall back to a local heuristic response.
 *
 *   This guarantees that a single overloaded model never blocks the user —
 *   we always cascade to the next available model within ~1-2 seconds.
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

// 7 free models, ordered roughly by capability (largest/most capable first
// so the user gets the best answer when capacity is available).
const AI_MODELS = [
  { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', name: 'Nemotron 3 Ultra 550B' },
  { id: 'openai/gpt-oss-120b:free', name: 'GPT-OSS 120B' },
  { id: 'nousresearch/hermes-3-llama-3.1-405b:free', name: 'Hermes 3 405B' },
  { id: 'qwen/qwen3-next-80b-a3b-instruct:free', name: 'Qwen3 Next 80B' },
  { id: 'google/gemma-4-31b-it:free', name: 'Gemma 4 31B' },
  { id: 'google/gemma-4-26b-a4b-it:free', name: 'Gemma 4 26B' },
  { id: 'openai/gpt-oss-20b:free', name: 'GPT-OSS 20B' },
]

// Cooldown tracker — model id → unix-ms timestamp until which it's skipped.
const cooldowns = new Map<string, number>()
const COOLDOWN_MS = 60_000 // 60 seconds

interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIResponse {
  content: string
  model: string
  modelName: string
  /** True if the response came from the local fallback (no AI was called). */
  local: boolean
}

interface CallAIOptions {
  maxTokens?: number
  temperature?: number
  /** If true, request JSON-mode response_format. Use for structured outputs. */
  json?: boolean
  /** Override the ordered model list (e.g. prefer small/fast models). */
  preferSmall?: boolean
}

/**
 * Call OpenRouter with fallback across all 7 models.
 * Cools down failed models for 60s before retrying them.
 */
export async function callAI(
  messages: AIMessage[],
  options?: CallAIOptions,
): Promise<AIResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    return generateLocalResponse(messages)
  }

  const maxTokens = options?.maxTokens ?? 500
  const temperature = options?.temperature ?? 0.7
  const wantJson = options?.json === true

  // Build candidate list — skip cooling-down models, but always keep at least 1.
  const now = Date.now()
  let candidates = AI_MODELS.filter((m) => {
    const cd = cooldowns.get(m.id)
    return !cd || cd <= now
  })
  if (candidates.length === 0) {
    // All cooling down — force-clear and use full list.
    cooldowns.clear()
    candidates = AI_MODELS.slice()
  }
  // If preferSmall, reorder so smaller models come first.
  if (options?.preferSmall) {
    candidates = [...candidates].sort((a, b) => sizeRank(a.id) - sizeRank(b.id))
  }

  for (const model of candidates) {
    try {
      const body: Record<string, unknown> = {
        model: model.id,
        messages,
        max_tokens: maxTokens,
        temperature,
      }
      if (wantJson) {
        body.response_format = { type: 'json_object' }
      }

      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://procible.app',
          'X-Title': 'ProCible CRM',
        },
        body: JSON.stringify(body),
      })

      // 429 / 5xx → cool down and try next.
      if (response.status === 429 || response.status >= 500) {
        cooldowns.set(model.id, Date.now() + COOLDOWN_MS)
        console.warn(
          `[AI] ${model.name} overloaded (${response.status}) — cooling down ${COOLDOWN_MS / 1000}s, trying next model`,
        )
        continue
      }

      if (!response.ok) {
        const errText = await response.text().catch(() => '')
        console.warn(`[AI] ${model.name} failed (${response.status}): ${errText.slice(0, 200)}`)
        // 4xx other than 429 → don't cool down (likely a permanent issue
        // with this prompt), but still try the next model.
        continue
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content
      if (content && typeof content === 'string' && content.trim().length > 0) {
        return {
          content: content.trim(),
          model: model.id,
          modelName: model.name,
          local: false,
        }
      }

      console.warn(`[AI] ${model.name} returned empty content`)
    } catch (error) {
      // Network error / timeout → cool down briefly and try next.
      cooldowns.set(model.id, Date.now() + COOLDOWN_MS)
      console.warn(
        `[AI] ${model.name} threw:`,
        error instanceof Error ? error.message : error,
      )
      continue
    }
  }

  console.warn('[AI] All models failed — using local fallback')
  return generateLocalResponse(messages)
}

/** Rough size rank for preferSmall ordering — smaller number = smaller model. */
function sizeRank(modelId: string): number {
  if (modelId.includes('20b')) return 1
  if (modelId.includes('26b')) return 2
  if (modelId.includes('31b')) return 3
  if (modelId.includes('80b')) return 4
  if (modelId.includes('120b')) return 5
  if (modelId.includes('405b')) return 6
  if (modelId.includes('550b')) return 7
  return 4
}

/**
 * Try to extract a JSON object from an AI response that may be wrapped in
 * markdown fences or have leading/trailing prose. Returns null on failure.
 */
export function extractJSON<T = unknown>(content: string): T | null {
  if (!content) return null
  // Strip markdown code fences if present.
  let s = content.trim()
  const fenceMatch = s.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenceMatch) s = fenceMatch[1].trim()
  // Try direct parse first.
  try {
    return JSON.parse(s) as T
  } catch {
    // Fall through to bracket extraction.
  }
  // Find first { ... } or [ ... ] block.
  const objStart = s.indexOf('{')
  const arrStart = s.indexOf('[')
  let start = -1
  let open = ''
  let close = ''
  if (objStart >= 0 && (arrStart < 0 || objStart < arrStart)) {
    start = objStart
    open = '{'
    close = '}'
  } else if (arrStart >= 0) {
    start = arrStart
    open = '['
    close = ']'
  }
  if (start < 0) return null
  // Find matching close by counting depth.
  let depth = 0
  for (let i = start; i < s.length; i++) {
    if (s[i] === open) depth++
    else if (s[i] === close) {
      depth--
      if (depth === 0) {
        const candidate = s.slice(start, i + 1)
        try {
          return JSON.parse(candidate) as T
        } catch {
          return null
        }
      }
    }
  }
  return null
}

/* -------------------------------------------------------------------------- */
/*  HIGH-VALUE AI FUNCTIONS                                                   */
/* -------------------------------------------------------------------------- */

/**
 * 1) Interpret a user's campaign to build a refined search query that finds
 *    CUSTOMERS for the user's product — not competitors selling the same
 *    product. This is the "Hermes agent" query builder.
 *
 * Example:
 *   productName = "Je vends des pneus de voiture neufs à Douala"
 *   → targetSegments = ["Garages auto", "Transporteurs", "Sociétés de livraison", "Taxis"]
 *     exclusions     = ["Boutique de pneus", "Vendeur de pneus", "Marchand de pneus"]
 *     searchQuery    = "acheteurs potentiels de pneus de voiture neufs à Douala
 *                       (garages, transporteurs, taxis) — exclure les vendeurs de pneus"
 */
export interface CampaignInterpretation {
  /** Refined search query to send to the lead-finding agent. */
  searchQuery: string
  /** Sector labels that describe POTENTIAL CUSTOMERS (priority targets). */
  targetSegments: string[]
  /** Sector / keyword patterns that describe COMPETITORS (to exclude). */
  exclusions: string[]
  /** Buyer persona summary in 1-2 sentences. */
  buyerPersona: string
  /** AI's reasoning, for transparency in the UI. */
  rationale: string
  /** Which model produced this interpretation. */
  model: string
}

export async function interpretCampaign(params: {
  productName: string
  locations: string
}): Promise<CampaignInterpretation> {
  const { productName, locations } = params

  const systemPrompt = `Tu es un expert en prospection commerciale B2B. L'utilisateur décrit SON activité (ce qu'il vend).
Ta mission : transformer cette description en une requête de recherche ciblée qui trouvera ses CLIENTS POTENTIELS — pas ses concurrents qui vendent le même produit.

Réfléchis ainsi :
1. Que vend l'utilisateur ? (produit/service)
2. Qui a BESOIN de ce produit ? (segments d'acheteurs : professions, secteurs, types d'entreprise)
3. Qui sont ses CONCURRENTS qu'il faut exclure ? (ceux qui vendent la même chose)

Réponds UNIQUEMENT en JSON valide avec cette structure exacte :
{
  "searchQuery": "string — requête prête à chercher des acheteurs, pas des vendeurs",
  "targetSegments": ["string", ...] — 3-6 segments d'acheteurs prioritaires,
  "exclusions": ["string", ...] — 2-5 patterns à exclure (concurrents),
  "buyerPersona": "string — 1-2 phrases décrivant l'acheteur idéal",
  "rationale": "string — 1 phrase expliquant la logique"
}`

  const userPrompt = `Description de l'activité de l'utilisateur :
« ${productName} »

Zones géographiques : ${locations}

Génère la requête de prospection ciblée.`

  const res = await callAI(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { maxTokens: 600, temperature: 0.3, json: true },
  )

  const parsed = extractJSON<CampaignInterpretation>(res.content)
  if (parsed && Array.isArray(parsed.targetSegments) && Array.isArray(parsed.exclusions)) {
    return {
      searchQuery: parsed.searchQuery || productName,
      targetSegments: parsed.targetSegments,
      exclusions: parsed.exclusions,
      buyerPersona: parsed.buyerPersona || '',
      rationale: parsed.rationale || '',
      model: res.model,
    }
  }

  // Local fallback interpretation — basic keyword inversion.
  return localInterpretCampaign(productName, res.model)
}

function localInterpretCampaign(productName: string, model: string): CampaignInterpretation {
  const lower = productName.toLowerCase()
  // Naive heuristic: assume the user is a seller; buyers are "clients de [produit]".
  return {
    searchQuery: `acheteurs potentiels de ${productName}`,
    targetSegments: ['Clients potentiels', 'Commerces', 'Particuliers'],
    exclusions: [lower, `vendeur de ${lower}`, `boutique de ${lower}`],
    buyerPersona: 'Acheteur potentiel du produit décrit.',
    rationale: 'Interprétation locale (IA indisponible) — heuristique basique.',
    model,
  }
}

/**
 * 2) Generate a hierarchical follow-up plan for a single lead.
 *    Each stage has: dayOffset (from lead creation), channel, objective,
 *    script, tips. The plan is multi-stage and adaptive to the lead's stage.
 */
export interface FollowUpStage {
  /** Stage number, 1-indexed. */
  step: number
  /** Days after lead creation when this stage fires. */
  dayOffset: number
  /** Channel: whatsapp | appel | email | visite | sms */
  channel: 'whatsapp' | 'appel' | 'email' | 'visite' | 'sms'
  /** Objective of this contact in 5-10 words. */
  objective: string
  /** Ready-to-send script (40-120 words). */
  script: string
  /** 1-3 short tactical tips. */
  tips: string[]
}

export interface FollowUpPlan {
  leadId: string
  stages: FollowUpStage[]
  /** Overall strategy summary, 1-2 sentences. */
  strategy: string
  /** Which AI model produced this plan. */
  model: string
  /** When the plan was generated. */
  createdAt: string
}

export async function generateFollowUpPlan(params: {
  leadName: string
  business: string | null
  sector: string | null
  city: string | null
  stage: string
  contactCount: number
  source: string
  productName: string | null
}): Promise<FollowUpPlan> {
  const { leadName, business, sector, city, stage, contactCount, source, productName } = params

  const systemPrompt = `Tu es un coach commercial expert. Tu crées un PLAN DE SUIVI HIÉRARCHISÉ pour un lead CRM.
Le plan doit comporter 4 à 5 étapes échelonnées dans le temps, chacune avec un canal, un objectif, un script PRÊT À ENVOYER, et des conseils tactiques.

Règles :
- Échelonne les étapes : J+1, J+3, J+7, J+14, J+30 (adapte selon l'étape actuelle du lead)
- Varie les canaux (whatsapp, appel, email, visite) pour ne pas lasser
- Chaque script doit être personnalisé avec le nom du lead et son activité
- Le script doit être réaliste, professionnel, et en français
- Inclus 1 à 3 conseils concrets par étape
- Adapte le plan à l'étape actuelle du lead (s'il est déjà "en_discussion", saute les premières étapes)

Réponds UNIQUEMENT en JSON valide :
{
  "strategy": "string — résumé de la stratégie en 1-2 phrases",
  "stages": [
    {
      "step": 1,
      "dayOffset": 1,
      "channel": "whatsapp",
      "objective": "Premier contact chaleureux",
      "script": "Bonjour [nom], ...",
      "tips": ["conseil 1", "conseil 2"]
    },
    ...
  ]
}`

  const userPrompt = `Lead à planifier :
- Nom : ${leadName}
- Activité : ${business || 'Non précisée'}
- Secteur : ${sector || 'Non précisé'}
- Ville : ${city || 'Non précisée'}
- Étape actuelle : ${stage}
- Nombre de contacts déjà effectués : ${contactCount}
- Source : ${source}
${productName ? `- Produit/service de l'utilisateur : ${productName}` : ''}

Génère un plan de suivi hiérarchisé et personnalisé.`

  const res = await callAI(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { maxTokens: 1200, temperature: 0.6, json: true },
  )

  const parsed = extractJSON<{ strategy: string; stages: FollowUpStage[] }>(res.content)
  if (parsed && Array.isArray(parsed.stages) && parsed.stages.length > 0) {
    // Sanitize stages.
    const stages: FollowUpStage[] = parsed.stages
      .filter((s) => s && typeof s.script === 'string')
      .map((s, i) => ({
        step: i + 1,
        dayOffset: typeof s.dayOffset === 'number' ? s.dayOffset : i * 3 + 1,
        channel: (['whatsapp', 'appel', 'email', 'visite', 'sms'].includes(s.channel)
          ? s.channel
          : 'whatsapp') as FollowUpStage['channel'],
        objective: s.objective || `Étape ${i + 1}`,
        script: s.script,
        tips: Array.isArray(s.tips) ? s.tips.slice(0, 3) : [],
      }))
    return {
      leadId: '', // caller fills in
      stages,
      strategy: parsed.strategy || 'Plan de suivi personnalisé généré par IA.',
      model: res.model,
      createdAt: new Date().toISOString(),
    }
  }

  // Local fallback plan.
  return localFollowUpPlan(leadName, business, stage, contactCount, res.model)
}

function localFollowUpPlan(
  leadName: string,
  business: string | null,
  stage: string,
  contactCount: number,
  model: string,
): FollowUpPlan {
  const safeName = leadName.split(' ')[0]
  const biz = business || 'votre activité'
  const stages: FollowUpStage[] = [
    {
      step: 1,
      dayOffset: 1,
      channel: 'whatsapp',
      objective: 'Premier contact chaleureux',
      script: `Bonjour ${safeName}, je suis ravi d'avoir découvert ${biz}. J'aimerais échanger avec vous sur une possible collaboration. Seriez-vous disponible cette semaine ?`,
      tips: ['Personnalisez avec une référence à leur activité', 'Restez bref et chaleureux'],
    },
    {
      step: 2,
      dayOffset: 3,
      channel: 'appel',
      objective: 'Approfondir le besoin',
      script: `Bonjour ${safeName}, suite à mon message, je vous appelle pour mieux comprendre vos besoins. Avez-vous 5 minutes ?`,
      tips: ['Préparez 3 questions ouvertes', 'Écoutez plus que vous ne parlez'],
    },
    {
      step: 3,
      dayOffset: 7,
      channel: 'email',
      objective: 'Envoyer une proposition',
      script: `Objet : Suite à notre échange\n\nBonjour ${safeName}, suite à notre conversation, voici une proposition adaptée à ${biz}. Je reste disponible pour en discuter.`,
      tips: ['Incluez 1 ou 2 bénéfices concrets', 'Terminez par un call-to-action clair'],
    },
    {
      step: 4,
      dayOffset: 14,
      channel: 'whatsapp',
      objective: 'Relance douce',
      script: `Bonjour ${safeName}, j'espère que vous allez bien. Avez-vous eu l'occasion de regarder ma proposition ?`,
      tips: ['Pas de pression, ton amical', 'Proposez un rendez-vous téléphonique'],
    },
  ]
  return {
    leadId: '',
    stages,
    strategy: `Plan local de suivi en 4 étapes pour ${leadName} (étape actuelle: ${stage}, ${contactCount} contact(s) précédent(s)).`,
    model,
    createdAt: new Date().toISOString(),
  }
}

/**
 * 3) Generate a single lead-specific message draft.
 *    (Existing function — kept for backward compat with /api/ai/draft.)
 */
export async function generateMessageDraft(params: {
  leadName: string
  business: string | null
  sector: string | null
  city: string | null
  contactCount: number
  lastContactType: string | null
  lastContactDate: string | null
  stage: string
  channel: 'whatsapp' | 'appel' | 'email'
  language?: string
}): Promise<AIResponse> {
  const { leadName, business, sector, city, contactCount, lastContactType, lastContactDate, stage, channel } = params

  const stageContext: Record<string, string> = {
    nouveau: 'Premier contact — ce lead ne connaît pas encore votre entreprise.',
    contacte: 'Vous avez déjà contacté ce lead une fois. Il faut relancer avec plus de valeur.',
    en_discussion: 'Discussion en cours — le lead montre de l\'intérêt. Il faut conclure.',
    a_relancer: 'Le lead n\'a pas répondu depuis un moment. Relance urgente avec accroche.',
    gagne: 'Lead converti — envoyer un message de suivi/merci.',
    perdu: 'Lead perdu — tenter une dernière relance ou demander un feedback.',
  }

  const channelContext: Record<string, string> = {
    whatsapp: 'Message WhatsApp — ton chaleureux, emojis modérés, court et direct.',
    appel: 'Script d\'appel téléphonique — phrases courtes, questions ouvertes, ton professionnel mais amical.',
    email: 'Email professionnel — structuré, objet clair, call-to-action précis.',
  }

  const contactStrategy =
    contactCount === 0
      ? 'Premier contact : présentez-vous, exprimez votre intérêt pour leur activité, proposez un échange.'
      : contactCount === 1
      ? 'Deuxième contact : rappelez le premier échange, ajoutez de la valeur (info, offre), proposez un rendez-vous.'
      : contactCount === 2
      ? 'Troisième contact : montrez les bénéfices concrets, proposez une offre limitée ou un essai.'
      : 'Contact multiples : dernier recours, soyez direct sur la valeur, proposez une action simple et immédiate.'

  const systemPrompt = `Tu es un assistant commercial expert pour ProCible CRM. Tu rédiges des messages de prospection personnalisés en français.
Règles :
- Adapte le ton au canal (${channel})
- Personnalise avec le nom et l'activité du lead
- Sois concis mais convaincant
- Inclus un call-to-action clair
- Pas de phrases génériques, chaque mot doit compter
- Langue: français camerounais si naturel, sinon français standard`

  const userPrompt = `Rédige un message ${channel} pour ce lead :

**Lead** : ${leadName}${business ? `, ${business}` : ''}${sector ? ` (${sector})` : ''}${city ? ` — ${city}` : ''}
**Étape** : ${stage} — ${stageContext[stage] || ''}
**Contacts précédents** : ${contactCount} (${contactStrategy})
${lastContactType ? `**Dernier contact** : ${lastContactType} le ${lastContactDate || 'récemment'}` : ''}
**Canal** : ${channel} — ${channelContext[channel] || ''}

Rédige uniquement le message, sans explication.`

  return callAI(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { temperature: 0.8 },
  )
}

/**
 * 4) Generate a lead score and AI suggestion
 *    (Existing function — kept for backward compat with /api/ai/analyze.)
 */
export async function analyzeLead(params: {
  leadName: string
  business: string | null
  sector: string | null
  city: string | null
  contactCount: number
  stage: string
  daysSinceLastContact: number | null
  source: string
}): Promise<{ suggestion: string; score: number }> {
  const { leadName, business, sector, city, contactCount, stage, daysSinceLastContact, source } = params

  // Score calculation (local, deterministic)
  let score = 50
  if (contactCount > 0) score += 10
  if (contactCount > 1) score += 5
  if (contactCount > 2) score += 5
  if (stage === 'en_discussion') score += 15
  if (stage === 'a_relancer') score -= 10
  if (stage === 'gagne') score = 100
  if (stage === 'perdu') score = 5
  if (daysSinceLastContact !== null && daysSinceLastContact > 7) score -= 10
  if (daysSinceLastContact !== null && daysSinceLastContact > 14) score -= 10
  if (source === 'linkedin') score += 5
  score = Math.max(0, Math.min(100, score))

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return { suggestion: generateLocalSuggestion(stage, contactCount, daysSinceLastContact), score }
  }

  try {
    const response = await callAI(
      [
        {
          role: 'system',
          content:
            'Tu es un expert CRM. Donne une recommandation actionnable en 1 phrase pour ce lead. Sois spécifique et direct.',
        },
        {
          role: 'user',
          content: `Lead: ${leadName}${business ? `, ${business}` : ''} | Secteur: ${sector || '?'} | Étape: ${stage} | Contacts: ${contactCount} | Jours sans contact: ${daysSinceLastContact ?? '?'} | Source: ${source}\n\nRecommandation:`,
        },
      ],
      { maxTokens: 100, temperature: 0.5, preferSmall: true },
    )

    return { suggestion: response.content, score }
  } catch {
    return { suggestion: generateLocalSuggestion(stage, contactCount, daysSinceLastContact), score }
  }
}

/* -------------------------------------------------------------------------- */
/*  LOCAL FALLBACKS                                                           */
/* -------------------------------------------------------------------------- */

function generateLocalResponse(messages: AIMessage[]): AIResponse {
  const lastUserMsg = messages.findLast?.(m => m.role === 'user')?.content
    || messages.filter(m => m.role === 'user').pop()?.content
    || ''

  let content = 'Je vous recommande de contacter ce lead dans les plus brefs délais pour maintenir l\'intérêt.'

  if (lastUserMsg.includes('whatsapp') || lastUserMsg.includes('WhatsApp')) {
    content = 'Bonjour ! Je me permets de vous contacter suite à ma découverte de votre activité. Seriez-vous disponible pour un échange rapide cette semaine ?'
  } else if (lastUserMsg.includes('appel') || lastUserMsg.includes('téléphone')) {
    content = 'Bonjour, je vous appelle concernant votre activité. J\'aimerais vous présenter une opportunité de collaboration. Quand seriez-vous disponible pour un échange ?'
  } else if (lastUserMsg.includes('email')) {
    content = 'Objet : Opportunité de collaboration\n\nBonjour,\n\nJ\'ai découvert votre activité récemment et je pense qu\'il y a des synergies possibles entre nos activités.\n\nSeriez-vous disponible pour un échange cette semaine ?\n\nCordialement'
  } else if (lastUserMsg.includes('relance') || lastUserMsg.includes('relancer')) {
    content = 'Bonjour ! J\'espère que vous allez bien. Je me permets de revenir vers vous suite à notre précédent échange. Avez-vous eu l\'occasion d\'y réfléchir ?'
  }

  return { content, model: 'local-fallback', modelName: 'Fallback Local', local: true }
}

function generateLocalSuggestion(stage: string, contactCount: number, daysSince: number | null): string {
  if (stage === 'nouveau') return 'Premier contact recommandé — appelez ou envoyez un WhatsApp dans les 24h.'
  if (stage === 'a_relancer') return 'Relance urgente — ce lead n\'a pas été contacté depuis longtemps.'
  if (stage === 'en_discussion') return 'Discussion en cours — proposez un rendez-vous pour conclure.'
  if (stage === 'contacte' && contactCount === 1) return 'Deuxième contact nécessaire — apportez de la valeur ajoutée.'
  if (stage === 'perdu') return 'Tentez une dernière relance avec une offre spéciale.'
  if (stage === 'gagne') return 'Lead converti — envoyez un suivi pour fidéliser.'
  if (daysSince !== null && daysSince > 7) return `Aucun contact depuis ${daysSince} jours — relancez rapidement.`
  return 'Contactez ce lead pour maintenir la relation.'
}
