export {
  AccountService,
  type AccountMatchKind,
  type ResolveResult,
  type AccountResolveInput,
} from './service';
export {
  AccountMergeService,
  AccountMergeError,
  type DuplicateAccountSummary,
  type DuplicateGroup,
  type DuplicateMatchKind,
} from './merge-service';
export { nameSimilarity, isSoftNameMatch, normalizeNameForMatch } from './name-similarity';
export { AccountRepository, type AccountRow } from './repository';
export { buildNormalizedKey } from './normalize-key';
export { normalizePhoneDigits, MIN_PHONE_DIGITS } from './phone';
export {
  extractBusinessDomain,
  extractDomainFromEmail,
  extractDomainFromWebsite,
  isGenericOrSocialHost,
} from './domain';
export {
  SuppressionService,
  SuppressionServiceError,
  normalizeSuppressionInput,
  type SuppressionEntry,
  type SuppressionInput,
  type SuppressionStatus,
} from './suppression-service';
