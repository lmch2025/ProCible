'use client'

import { useI18n } from '@/lib/i18n'
import { STAGE_CONFIG, type LeadStage } from '@/store/procible-store'

/**
 * Resolve a stage's label in the current locale.
 * Usage: const stageLabel = useStageLabel(); stageLabel('nouveau') → 'New' / 'Nouveau'
 */
export function useStageLabel() {
  const { t } = useI18n()
  return (stage: LeadStage): string => t(STAGE_CONFIG[stage].labelKey)
}

/**
 * Returns the full localized stage config map.
 */
export function useLocalizedStages() {
  const { t } = useI18n()
  return (stage: LeadStage) => ({
    ...STAGE_CONFIG[stage],
    label: t(STAGE_CONFIG[stage].labelKey),
  })
}
