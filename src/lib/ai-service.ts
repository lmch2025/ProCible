/**
 * OpenRouter AI Service — 7 free models with automatic fallback chain
 * 
 * Models are ordered by capability/reliability.
 * If one fails, the next is tried automatically.
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

// 7 best free models on OpenRouter, ordered by quality
const AI_MODELS = [
  { id: 'deepseek/deepseek-r1-0528:free', name: 'DeepSeek R1' },
  { id: 'qwen/qwen3-32b:free', name: 'Qwen 3 32B' },
  { id: 'google/gemma-3-27b-it:free', name: 'Gemma 3 27B' },
  { id: 'meta-llama/llama-4-maverick:free', name: 'Llama 4 Maverick' },
  { id: 'mistralai/mistral-small-3.1-24b-instruct:free', name: 'Mistral Small 3.1' },
  { id: 'google/gemma-3-12b-it:free', name: 'Gemma 3 12B' },
  { id: 'microsoft/phi-4-reasoning:free', name: 'Phi-4 Reasoning' },
]

interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface AIResponse {
  content: string
  model: string
  modelName: string
}

/**
 * Call OpenRouter with fallback across all 7 models
 */
export async function callAI(
  messages: AIMessage[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<AIResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY
  
  if (!apiKey) {
    // Fallback: return a structured response without AI
    return generateLocalResponse(messages)
  }

  const maxTokens = options?.maxTokens || 500
  const temperature = options?.temperature || 0.7

  // Try each model in order until one succeeds
  for (const model of AI_MODELS) {
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://hermes-crm.app',
          'X-Title': 'Hermes CRM',
        },
        body: JSON.stringify({
          model: model.id,
          messages,
          max_tokens: maxTokens,
          temperature,
        }),
      })

      if (!response.ok) {
        const errText = await response.text().catch(() => '')
        console.warn(`[AI] Model ${model.name} failed (${response.status}): ${errText}`)
        continue // Try next model
      }

      const data = await response.json()
      
      if (data.choices?.[0]?.message?.content) {
        return {
          content: data.choices[0].message.content,
          model: model.id,
          modelName: model.name,
        }
      }
      
      console.warn(`[AI] Model ${model.name} returned empty content`)
    } catch (error) {
      console.warn(`[AI] Model ${model.name} threw error:`, error instanceof Error ? error.message : error)
      continue
    }
  }

  // All models failed — use local fallback
  console.warn('[AI] All models failed, using local fallback')
  return generateLocalResponse(messages)
}

/**
 * Generate a message draft based on lead info and contact history
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
    'nouveau': 'Premier contact — ce lead ne connaît pas encore votre entreprise.',
    'contacte': 'Vous avez déjà contacté ce lead une fois. Il faut relancer avec plus de valeur.',
    'en_discussion': 'Discussion en cours — le lead montre de l\'intérêt. Il faut conclure.',
    'a_relancer': 'Le lead n\'a pas répondu depuis un moment. Relance urgente avec accroche.',
    'gagne': 'Lead converti — envoyer un message de suivi/merci.',
    'perdu': 'Lead perdu — tenter une dernière relance ou demander un feedback.',
  }

  const channelContext: Record<string, string> = {
    'whatsapp': 'Message WhatsApp — ton chaleureux, emojis modérés, court et direct.',
    'appel': 'Script d\'appel téléphonique — phrases courtes, questions ouvertes, ton professionnel mais amical.',
    'email': 'Email professionnel — structuré, objet clair, call-to-action précis.',
  }

  const contactStrategy = contactCount === 0
    ? 'Premier contact : présentez-vous, exprimez votre intérêt pour leur activité, proposez un échange.'
    : contactCount === 1
    ? 'Deuxième contact : rappelez le premier échange, ajoutez de la valeur (info, offre), proposez un rendez-vous.'
    : contactCount === 2
    ? 'Troisième contact : montrez les bénéfices concrets, proposez une offre limitée ou un essai.'
    : contactCount >= 3
    ? 'Contact multiples : dernier recours, soyez direct sur la valeur, proposez une action simple et immédiate.'
    : ''

  const systemPrompt = `Tu es un assistant commercial expert pour Hermes CRM. Tu rédiges des messages de prospection personnalisés en français.
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

  return callAI([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], { temperature: 0.8 })
}

/**
 * Generate a lead score and AI suggestion
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

  // Try AI suggestion
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return { suggestion: generateLocalSuggestion(stage, contactCount, daysSinceLastContact), score }
  }

  try {
    const response = await callAI([
      {
        role: 'system',
        content: 'Tu es un expert CRM. Donne une recommandation actionnable en 1 phrase pour ce lead. Sois spécifique et direct.',
      },
      {
        role: 'user',
        content: `Lead: ${leadName}${business ? `, ${business}` : ''} | Secteur: ${sector || '?'} | Étape: ${stage} | Contacts: ${contactCount} | Jours sans contact: ${daysSinceLastContact ?? '?'} | Source: ${source}\n\nRecommandation:`,
      },
    ], { maxTokens: 100, temperature: 0.5 })

    return { suggestion: response.content.trim(), score }
  } catch {
    return { suggestion: generateLocalSuggestion(stage, contactCount, daysSinceLastContact), score }
  }
}

/**
 * Local fallback when no AI is available
 */
function generateLocalResponse(messages: AIMessage[]): AIResponse {
  const lastUserMsg = messages.findLast(m => m.role === 'user')?.content || ''
  
  // Simple pattern matching for common CRM tasks
  let content = 'Je vous recommande de contacter ce lead dans les plus brefs délais pour maintenir l\'intérêt.'
  
  if (lastUserMsg.includes('whatsapp') || lastUserMsg.includes('WhatsApp')) {
    content = 'Bonjour ! 👋 Je me permets de vous contacter suite à ma découverte de votre activité. Seriez-vous disponible pour un échange rapide cette semaine ?'
  } else if (lastUserMsg.includes('appel') || lastUserMsg.includes('téléphone')) {
    content = 'Bonjour, je vous appelle concernant votre activité. J\'aimerais vous présenter une opportunité de collaboration. Quand seriez-vous disponible pour un échange ?'
  } else if (lastUserMsg.includes('email')) {
    content = 'Objet : Opportunité de collaboration\n\nBonjour,\n\nJ\'ai découvert votre activité récemment et je pense qu\'il y a des synergies possibles entre nos activités.\n\nSeriez-vous disponible pour un échange cette semaine ?\n\nCordialement'
  } else if (lastUserMsg.includes('relance') || lastUserMsg.includes('relancer')) {
    content = 'Bonjour ! J\'espère que vous allez bien. Je me permets de revenir vers vous suite à notre précédent échange. Avez-vous eu l\'occasion d\'y réfléchir ?'
  }

  return { content, model: 'local-fallback', modelName: 'Fallback Local' }
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
