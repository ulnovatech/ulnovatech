import { DiscoveryService } from '@agency/discovery';
import { createDiscoveryRunSchema } from '@agency/validation';
import { requireOperator } from '@/lib/api-auth';
import { enqueueRunPipeline, isInlinePipelineEnabled, resumeRunPipeline } from '@/lib/job-worker';
import { NextResponse } from 'next/server';

const discovery = new DiscoveryService();

export async function GET() {
  try {
    const runs = await discovery.listRuns();
    return NextResponse.json({ runs });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    const body = await request.json();
    const parsed = createDiscoveryRunSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const run = await discovery.prepareRun(parsed.data);
    await enqueueRunPipeline(run.id);

    const inline = isInlinePipelineEnabled();
    if (inline) {
      await resumeRunPipeline(run.id);
    }

    return NextResponse.json(
      {
        run: await discovery.getRun(run.id),
        queued: true,
        inlinePipeline: inline,
        message: inline
          ? 'Run started — pipeline advances on each progress poll (INLINE_PIPELINE dev mode)'
          : 'Run queued — start job worker: pnpm jobs:worker',
      },
      { status: 201 },
    );
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
