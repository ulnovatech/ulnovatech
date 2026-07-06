import { requireOperator } from '@/lib/api-auth';
import { IntentService } from '@agency/intent';
import { QualificationService } from '@agency/qualification';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const intent = new IntentService();
const qualification = new QualificationService();

const bodySchema = z
  .object({
    name: z.string().min(1).max(300).optional(),
    city: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    industry: z.string().max(200).optional(),
    website: z.string().url().max(500).optional().or(z.literal('')),
  })
  .optional();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    const { id } = await params;
    const raw = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const input = parsed.data
      ? {
          ...parsed.data,
          website: parsed.data.website || undefined,
        }
      : undefined;

    const result = await intent.createProspectFromDemand(id, input);
    const score = await qualification.scoreBusiness(result.businessId);
    return NextResponse.json({ ...result, score }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
