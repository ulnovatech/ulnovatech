import {
  QualificationService,
  type VerificationFilter,
  type WorkQueueFilters,
} from '@agency/qualification';
import type { OpportunityType, Reachability } from '@agency/scoring';
import { NextResponse } from 'next/server';

const qualification = new QualificationService();

function parseVerification(value: string | null): VerificationFilter | undefined {
  if (value === 'verified' || value === 'unverified' || value === 'all') return value;
  return undefined;
}

function parseKind(value: string | null): WorkQueueFilters['kind'] | undefined {
  if (value === 'all' || value === 'demand' || value === 'opportunity') return value;
  return undefined;
}

const OPPORTUNITY_TYPES: OpportunityType[] = [
  'demand_response',
  'greenfield',
  'redesign',
  'modernize',
  'general',
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const oppType = searchParams.get('opportunityType');
    const filters: WorkQueueFilters = {
      kind: parseKind(searchParams.get('kind')),
      runId: searchParams.get('runId') ?? undefined,
      minScore: searchParams.get('minScore')
        ? parseInt(searchParams.get('minScore')!, 10)
        : undefined,
      reachability: (searchParams.get('reachability') as Reachability) || undefined,
      verification: parseVerification(searchParams.get('verification')),
      opportunityType:
        oppType && OPPORTUNITY_TYPES.includes(oppType as OpportunityType)
          ? (oppType as OpportunityType)
          : undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20,
    };

    const result = await qualification.getWorkQueue(filters);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
