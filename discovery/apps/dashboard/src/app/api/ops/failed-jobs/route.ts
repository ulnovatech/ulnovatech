import { FailedJobsService } from '@agency/ops';
import { NextResponse } from 'next/server';

const failedJobs = new FailedJobsService();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days');
    const limit = searchParams.get('limit');
    const result = await failedJobs.list(
      days != null ? Number(days) : undefined,
      limit != null ? Number(limit) : undefined,
    );
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
