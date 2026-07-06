import { requireOperator } from '@/lib/api-auth';
import {
  mergeImportedLocalePacks,
  normalizeLocalePack,
  parseLocalePackDocument,
  parseLocalePackJson,
  platformSettings,
} from '@agency/settings';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const bodySchema = z.object({
  format: z.enum(['json', 'doc']),
  content: z.string().min(1),
  merge: z.boolean().optional(),
});

export async function POST(request: Request) {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const imported =
      parsed.data.format === 'json'
        ? parseLocalePackJson(JSON.parse(parsed.data.content))
        : [parseLocalePackDocument(parsed.data.content)];

    const current = await platformSettings.ensureLoaded();
    const existing = current.locales.packs;
    const merge = parsed.data.merge !== false;

    const nextPacks = merge
      ? mergeImportedLocalePacks(existing, imported)
      : imported.map(normalizeLocalePack);

    const locales = await platformSettings.updateLocales({ packs: nextPacks });

    return NextResponse.json({
      imported: imported.length,
      packs: locales.packs,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
