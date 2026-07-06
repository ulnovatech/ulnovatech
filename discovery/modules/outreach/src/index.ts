export { OutreachService } from './service';
export { DEFAULT_OUTREACH_TEMPLATES, OUTREACH_OPPORTUNITY_TYPES } from './default-templates';
export { buildMergeContext, mergeTemplate } from './template-merge';
export type { MergeContext } from './template-merge';
export {
  composeOutreachBody,
  type OpenerEvidenceRef,
  type RecommendedOutreachEnrichment,
} from './compose-outreach-body';export {
  DEFAULT_EXPORT_STATUSES,
  hasContactPath,
  resolveExportStatuses,
} from './export-gates';
