import type { AcquisitionJobStage } from './types';
import { PIPELINE_JOB_STAGES } from './types';
import { getPipelineStagesForRun, type RunProfile } from './pipeline-stages';

export function getPipelinePlanForProfile(
  runProfile: RunProfile,
  browserEnabled?: boolean,
): AcquisitionJobStage[] {
  return getPipelineStagesForRun(runProfile, browserEnabled);
}

export function getNextPipelineStage(
  current: AcquisitionJobStage,
  plan: AcquisitionJobStage[],
): AcquisitionJobStage | null {
  const idx = plan.indexOf(current);
  if (idx < 0 || idx >= plan.length - 1) return null;
  return plan[idx + 1] ?? null;
}

export function stageIndex(stage: AcquisitionJobStage, plan = PIPELINE_JOB_STAGES): number {
  return plan.indexOf(stage);
}

export function priorStagesMustComplete(
  stage: AcquisitionJobStage,
  plan: AcquisitionJobStage[],
): AcquisitionJobStage[] {
  const idx = plan.indexOf(stage);
  if (idx <= 0) return [];
  return plan.slice(0, idx);
}
