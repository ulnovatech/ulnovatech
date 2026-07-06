import { SuppressionService, SuppressionServiceError } from '@agency/accounts';
import { requireOperator } from '@/lib/api-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const suppression = new SuppressionService();

const addSchema = z.object({
  email: z.string().max(255).optional(),
  phone: z.string().max(50).optional(),
  domain: z.string().max(255).optional(),
  reason: z.string().max(500).optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '200', 10) || 200, 500);
    const entries = await suppression.list(limit);
    return NextResponse.json({ entries });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    const body = await request.json();
    const parsed = addSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const entry = await suppression.add(parsed.data);
    return NextResponse.json({ entry }, { status: 201 });
  } catch (e) {
    if (e instanceof SuppressionServiceError) {
      const status = e.code === 'DUPLICATE' ? 409 : 400;
      return NextResponse.json({ error: e.message, code: e.code }, { status });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id query parameter required' }, { status: 400 });
    }

    await suppression.remove(id);
    return NextResponse.json({ removed: true });
  } catch (e) {
    if (e instanceof SuppressionServiceError && e.code === 'NOT_FOUND') {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
