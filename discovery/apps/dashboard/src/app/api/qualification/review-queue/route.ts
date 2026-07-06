import {
  QualificationService,
  type ReviewQueueFilters,
  type VerificationFilter,
} from '@agency/qualification';
import type { Reachability } from '@agency/scoring';
import { NextResponse } from 'next/server';

const qualification = new QualificationService();

function parseVerification(value: string | null): VerificationFilter | undefined {
  if (value === 'verified' || value === 'unverified' || value === 'all') return value;
  return undefined;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters: ReviewQueueFilters = {
      runId: searchParams.get('runId') ?? undefined,
      minScore: searchParams.get('minScore')
        ? parseInt(searchParams.get('minScore')!, 10)
        : undefined,
      reachability: (searchParams.get('reachability') as Reachability) || undefined,
      verification: parseVerification(searchParams.get('verification')),
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20,
    };

    const result = await qualification.getReviewQueue(filters);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
