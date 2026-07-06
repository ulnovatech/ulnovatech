import { isBrowserAutomationEnabled } from '@agency/config';
import { PIPELINE_JOB_STAGES, type AcquisitionJobStage } from './types';

export type RunProfile = 'micro' | 'standard' | 'boost';

/** Base pipeline (all run profiles). Browser enrich is boost-only when enabled. */
export function getPipelineStagesForRun(
  runProfile: RunProfile,
  browserEnabled = isBrowserAutomationEnabled(),
): AcquisitionJobStage[] {
  const stages: AcquisitionJobStage[] = [...PIPELINE_JOB_STAGES];
  if (runProfile === 'boost' && browserEnabled) {
    const scoreIdx = stages.indexOf('score');
    if (scoreIdx >= 0) {
      stages.splice(scoreIdx + 1, 0, 'browser_enrich');
    }
  }
  return stages;
}
