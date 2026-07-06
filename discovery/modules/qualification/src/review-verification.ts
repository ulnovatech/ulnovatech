import { sql } from 'drizzle-orm';

export type VerificationFilter = 'verified' | 'unverified' | 'all';

export type ProspectContactInput = {
  businessEmail?: string | null;
  businessPhone?: string | null;
  accountEmail?: string | null;
  accountPhone?: string | null;
  accountMetadata?: Record<string, unknown> | null;
};

/** SQL fragment — requires `businesses` as `b` and `accounts` as `a`. */
export const prospectVerifiedSql = sql`(
  NULLIF(trim(COALESCE(b.email, a.email, '')), '') IS NOT NULL
  OR NULLIF(trim(COALESCE(b.phone, a.phone, '')), '') IS NOT NULL
  OR (a.metadata->>'placesVerified') = 'true'
  OR NULLIF(trim(COALESCE(a.metadata->>'placesId', '')), '') IS NOT NULL
)`;

export function isProspectVerified(input: ProspectContactInput): boolean {
  const email = (input.businessEmail || input.accountEmail || '').trim();
  if (email.length > 0) return true;

  const phone = (input.businessPhone || input.accountPhone || '').trim();
  if (phone.length > 0) return true;

  const meta = input.accountMetadata;
  if (meta?.placesVerified === true) return true;
  if (typeof meta?.placesId === 'string' && meta.placesId.trim().length > 0) return true;

  return false;
}

export function canPromoteFromReview(input: {
  verified: boolean;
  reachability: string;
  hasEmail: boolean;
  hasPhone: boolean;
}): { allowed: boolean; reason?: string } {
  if (input.verified) return { allowed: true };
  if (input.reachability === 'none' && !input.hasEmail && !input.hasPhone) {
    return {
      allowed: false,
      reason: 'No contact path — verify via Places or enrichment before accepting.',
    };
  }
  return { allowed: true };
}
