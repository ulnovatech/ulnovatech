import { CSV_MAX_BYTES, previewCsvContent, saveCsvImportFile } from '@agency/discovery';
import { platformSettings } from '@agency/settings';
import { requireOperator } from '@/lib/api-auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const operator = await requireOperator();
  if (operator instanceof NextResponse) return operator;

  try {
    await platformSettings.ensureLoaded();
    const contentType = request.headers.get('content-type') ?? '';

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const file = form.get('file');
      if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: 'Missing file field' }, { status: 400 });
      }
      if (!file.name.toLowerCase().endsWith('.csv')) {
        return NextResponse.json({ error: 'Only .csv files are accepted' }, { status: 400 });
      }
      if (file.size > CSV_MAX_BYTES) {
        return NextResponse.json(
          { error: `File exceeds ${CSV_MAX_BYTES / (1024 * 1024)}MB limit` },
          { status: 400 },
        );
      }

      const content = await file.text();
      const result = saveCsvImportFile(content);
      const preview = previewCsvContent(content);

      return NextResponse.json({
        uploaded: true,
        fileName: file.name,
        ...result,
        preview,
      });
    }

    if (contentType.includes('application/json')) {
      const body = (await request.json()) as { content?: string };
      if (!body.content?.trim()) {
        return NextResponse.json({ error: 'Missing content' }, { status: 400 });
      }
      if (Buffer.byteLength(body.content, 'utf-8') > CSV_MAX_BYTES) {
        return NextResponse.json(
          { error: `Content exceeds ${CSV_MAX_BYTES / (1024 * 1024)}MB limit` },
          { status: 400 },
        );
      }

      const result = saveCsvImportFile(body.content);
      const preview = previewCsvContent(body.content);

      return NextResponse.json({
        uploaded: true,
        ...result,
        preview,
      });
    }

    return NextResponse.json(
      { error: 'Use multipart/form-data with a file or application/json with content' },
      { status: 400 },
    );
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
