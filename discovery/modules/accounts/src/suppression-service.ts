import { suppressionList } from '@agency/database';
import { extractDomainFromEmail, extractDomainFromWebsite } from './domain';
import { normalizePhoneDigits } from './phone';
import { AccountRepository, type AccountRow } from './repository';

export type SuppressionEntry = typeof suppressionList.$inferSelect;

export type SuppressionInput = {
  email?: string;
  phone?: string;
  domain?: string;
  reason?: string;
};

export type SuppressionStatus = {
  suppressed: boolean;
  source: 'account' | 'list' | null;
};

export class SuppressionServiceError extends Error {
  constructor(
    message: string,
    readonly code: 'INVALID' | 'NOT_FOUND' | 'DUPLICATE',
  ) {
    super(message);
    this.name = 'SuppressionServiceError';
  }
}

function normalizeDomainInput(value?: string | null): string | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  if (trimmed.includes('@')) return extractDomainFromEmail(trimmed);
  return extractDomainFromWebsite(trimmed);
}

export function normalizeSuppressionInput(input: SuppressionInput): {
  email: string | null;
  phone: string | null;
  domain: string | null;
  reason: string | null;
} {
  const rawEmail = input.email?.trim().toLowerCase() || null;
  const email = rawEmail && rawEmail.includes('@') ? rawEmail : null;
  const phoneDigits = normalizePhoneDigits(input.phone);
  const phone = phoneDigits ?? (input.phone?.trim() || null);
  const domain = normalizeDomainInput(input.domain);

  return {
    email,
    phone,
    domain,
    reason: input.reason?.trim() || null,
  };
}

export class SuppressionService {
  private repo = new AccountRepository();

  async list(limit = 200): Promise<SuppressionEntry[]> {
    return this.repo.listSuppressionEntries(limit);
  }

  async add(input: SuppressionInput): Promise<SuppressionEntry> {
    const normalized = normalizeSuppressionInput(input);
    if (!normalized.email && !normalized.phone && !normalized.domain) {
      throw new SuppressionServiceError(
        'Provide at least one of email, phone, or domain',
        'INVALID',
      );
    }

    const existing = await this.repo.findSuppressionEntry(normalized);
    if (existing) {
      throw new SuppressionServiceError('Suppression entry already exists', 'DUPLICATE');
    }

    return this.repo.addSuppressionEntry(normalized);
  }

  async remove(id: string): Promise<boolean> {
    const removed = await this.repo.deleteSuppressionEntry(id);
    if (!removed) {
      throw new SuppressionServiceError('Suppression entry not found', 'NOT_FOUND');
    }
    return true;
  }

  async getStatus(account: AccountRow): Promise<SuppressionStatus> {
    if (account.suppressed) {
      return { suppressed: true, source: 'account' };
    }
    if (await this.repo.matchesSuppressionList(account)) {
      return { suppressed: true, source: 'list' };
    }
    return { suppressed: false, source: null };
  }
}
