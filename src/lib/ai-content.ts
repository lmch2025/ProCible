/**
 * AI content encoding helpers.
 *
 * We store AI-generated content in `Lead.aiSuggestion`. To make the model
 * transparent to the user (and to admin coaching views), we encode the
 * model identity alongside the content using simple, human-readable markers:
 *
 *   1. Plain suggestions (analyze, draft):
 *        `__AI__<model-id>__<content>`
 *      e.g. `__AI__nvidia/nemotron-3-ultra-550b-a55b:free__Bonjour...`
 *
 *   2. Follow-up plans (already JSON-encoded with the model field inside):
 *        `__FOLLOW_UP_PLAN__<json>`
 *      The JSON itself contains `model` and (optionally) `modelName`.
 *
 *   3. Legacy / untagged content (older rows, or hand-written notes):
 *        plain text, no marker — treated as "unknown model".
 *
 * The UI uses `parseStoredSuggestion()` to extract the model id and render
 * a "Proposé par <Model Name>" badge next to the content.
 */

import type { FollowUpPlan } from './ai-service'

export const PLAN_MARKER = '__FOLLOW_UP_PLAN__'
export const SUGGESTION_MARKER = '__AI__'

/** Canonical map of model id → short display name (mirror of ai-service.ts). */
export const AI_MODEL_NAMES: Record<string, string> = {
  'nvidia/nemotron-3-ultra-550b-a55b:free': 'Nemotron 3 Ultra 550B',
  'openai/gpt-oss-120b:free': 'GPT-OSS 120B',
  'openai/gpt-oss-20b:free': 'GPT-OSS 20B',
  'google/gemma-4-31b-it:free': 'Gemma 4 31B',
  'google/gemma-4-26b-a4b-it:free': 'Gemma 4 26B',
  'qwen/qwen3-next-80b-a3b-instruct:free': 'Qwen3 Next 80B',
  'nousresearch/hermes-3-llama-3.1-405b:free': 'Hermes 3 405B',
  'local-fallback': 'Fallback Local',
}

/**
 * Convert a model id to a short, user-facing display name.
 * Falls back to the raw id if unknown.
 */
export function modelDisplayName(modelId: string | null | undefined): string {
  if (!modelId) return ''
  return AI_MODEL_NAMES[modelId] || modelId
}

/**
 * Encode a plain AI suggestion with the model id prefix.
 * Inverse of `parseStoredSuggestion()`.
 *
 * Example:
 *   encodeSuggestion('Bonjour!', 'nvidia/nemotron-3-ultra-550b-a55b:free')
 *   → '__AI__nvidia/nemotron-3-ultra-550b-a55b:free__Bonjour!'
 */
export function encodeSuggestion(content: string, modelId: string): string {
  return `${SUGGESTION_MARKER}${modelId}__${content}`
}

/** Encode a follow-up plan (JSON) with the marker prefix. */
export function encodePlan(plan: FollowUpPlan): string {
  return `${PLAN_MARKER}${JSON.stringify(plan)}`
}

export type StoredSuggestionKind = 'plan' | 'suggestion' | 'plain'

export interface ParsedSuggestion {
  kind: StoredSuggestionKind
  /** The model id, when extractable. Null for legacy/plain content. */
  modelId: string | null
  /** Short human-facing model name (e.g. "Nemotron 3 Ultra 550B"). */
  modelDisplay: string
  /** For plain suggestions: the message text. For plans: the strategy summary. */
  content: string
  /** For plans: the parsed plan object. Otherwise null. */
  plan: FollowUpPlan | null
  /** True if the response came from the local fallback (no AI was called). */
  isLocal: boolean
}

/**
 * Parse a stored `Lead.aiSuggestion` value into a structured object.
 * Always returns a value — never throws.
 */
export function parseStoredSuggestion(raw: string | null | undefined): ParsedSuggestion {
  if (!raw) {
    return {
      kind: 'plain',
      modelId: null,
      modelDisplay: '',
      content: '',
      plan: null,
      isLocal: false,
    }
  }

  // 1. Follow-up plan
  if (raw.startsWith(PLAN_MARKER)) {
    try {
      const plan = JSON.parse(raw.slice(PLAN_MARKER.length)) as FollowUpPlan
      return {
        kind: 'plan',
        modelId: plan.model || null,
        modelDisplay: modelDisplayName(plan.model),
        content: plan.strategy || '',
        plan,
        isLocal: plan.model === 'local-fallback',
      }
    } catch {
      // Malformed JSON — fall through to plain.
    }
  }

  // 2. Tagged suggestion: __AI__<model>__<content>
  if (raw.startsWith(SUGGESTION_MARKER)) {
    const rest = raw.slice(SUGGESTION_MARKER.length)
    // The model id always contains a slash (e.g. "nvidia/...") or is
    // "local-fallback". Split on the first "__" that appears AFTER the model
    // id's slash to avoid splitting on any underscores inside the id.
    // Strategy: find the first occurrence of "___" boundary — but simpler:
    // we know our model ids never contain "__" themselves (verified for the
    // 7 OpenRouter ids + local-fallback), so we can split on "__".
    const sepIdx = rest.indexOf('__')
    if (sepIdx > 0) {
      const modelId = rest.slice(0, sepIdx)
      const content = rest.slice(sepIdx + 2)
      return {
        kind: 'suggestion',
        modelId,
        modelDisplay: modelDisplayName(modelId),
        content,
        plan: null,
        isLocal: modelId === 'local-fallback',
      }
    }
  }

  // 3. Legacy / untagged
  return {
    kind: 'plain',
    modelId: null,
    modelDisplay: '',
    content: raw,
    plan: null,
    isLocal: false,
  }
}

/**
 * Tailwind color classes for the model badge, by capability tier.
 * Larger models get the more premium purple hue; smaller models get cooler
 * tones; the local fallback gets a neutral gray.
 */
export function modelBadgeColor(modelId: string | null | undefined): string {
  if (!modelId) return 'bg-gray-100 text-gray-500'
  if (modelId === 'local-fallback') return 'bg-gray-200 text-gray-600'
  if (modelId.includes('550b') || modelId.includes('405b')) return 'bg-[#6C3FA9]/10 text-[#6C3FA9]'
  if (modelId.includes('120b')) return 'bg-[#FF7B54]/10 text-[#FF7B54]'
  if (modelId.includes('80b')) return 'bg-[#2EC4B6]/10 text-[#2EC4B6]'
  if (modelId.includes('31b') || modelId.includes('26b')) return 'bg-[#FFB347]/10 text-[#FFB347]'
  if (modelId.includes('20b')) return 'bg-[#4CAF50]/10 text-[#4CAF50]'
  return 'bg-[#6C3FA9]/10 text-[#6C3FA9]'
}
