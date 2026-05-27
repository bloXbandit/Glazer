// ============================================================
// CSV UPLOAD — POST /api/clients/upload
//              GET  /api/clients/upload/template
// POST: accepts multipart/form-data with a "file" field (CSV).
// GET:  returns a blank CSV template for download.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { upsertClient } from '@/lib/db';
import { normalizePhone } from '@/lib/signalwire';

// ── CSV template columns ──────────────────────────────────────

const TEMPLATE_HEADERS = [
  'name', 'phone', 'email',
  'project_location', 'project_type_raw', 'glazing_category',
  'approx_size', 'timeline', 'new_construction',
  'status', 'notes',
];

export async function GET() {
  const csv = TEMPLATE_HEADERS.join(',') + '\n' +
    'John Smith,+12025551234,john@example.com,Washington DC,storefront,Commercial,1200 sqft,Q3 2025,false,new,Interested in curtainwall\n';

  return new NextResponse(csv, {
    headers: {
      'Content-Type':        'text/csv',
      'Content-Disposition': 'attachment; filename="client-upload-template.csv"',
    },
  });
}

export async function POST(req: NextRequest) {
  let csvText = '';

  const contentType = req.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    csvText = await (file as File).text();
  } else if (contentType.includes('text/csv') || contentType.includes('text/plain')) {
    csvText = await req.text();
  } else {
    return NextResponse.json(
      { error: 'Expected multipart/form-data with a "file" field or text/csv body' },
      { status: 400 }
    );
  }

  const { rows, headers } = parseCsv(csvText);

  if (rows.length === 0) {
    return NextResponse.json({ error: 'CSV is empty or has no data rows' }, { status: 400 });
  }

  const result = { inserted: 0, updated: 0, skipped: 0, errors: [] as string[] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawPhone = getCsvField(row, headers, 'phone');

    if (!rawPhone) {
      result.skipped++;
      result.errors.push(`Row ${i + 2}: missing phone — skipped`);
      continue;
    }

    const phone = normalizePhone(rawPhone.trim());

    if (!/^\+1\d{10}$/.test(phone) && !/^\+\d{7,15}$/.test(phone)) {
      result.skipped++;
      result.errors.push(`Row ${i + 2}: invalid phone "${rawPhone}" — skipped`);
      continue;
    }

    try {
      const newConst = getCsvField(row, headers, 'new_construction');
      const existing = (await import('@/lib/db')).getClientByPhone(phone);

      upsertClient({
        phone,
        name:             getCsvField(row, headers, 'name')             || null,
        email:            getCsvField(row, headers, 'email')            || null,
        project_location: getCsvField(row, headers, 'project_location') || null,
        project_type_raw: getCsvField(row, headers, 'project_type_raw') || null,
        glazing_category: getCsvField(row, headers, 'glazing_category') || null,
        approx_size:      getCsvField(row, headers, 'approx_size')      || null,
        timeline:         getCsvField(row, headers, 'timeline')         || null,
        notes:            getCsvField(row, headers, 'notes')            || null,
        status:           getCsvField(row, headers, 'status')           || 'new',
        contact_type:     'upload',
        source:           'upload',
        new_construction: newConst
          ? newConst.toLowerCase() === 'true' || newConst === '1' ? 1 : 0
          : null,
      });

      if (existing) { result.updated++; } else { result.inserted++; }
    } catch (err) {
      result.errors.push(`Row ${i + 2}: ${err instanceof Error ? err.message : String(err)}`);
      result.skipped++;
    }
  }

  return NextResponse.json({
    ok:       true,
    inserted: result.inserted,
    updated:  result.updated,
    skipped:  result.skipped,
    total:    rows.length,
    errors:   result.errors.slice(0, 20), // cap error list
  });
}

// ── Minimal RFC-4180 CSV parser ───────────────────────────────

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const nonEmpty = lines.filter(l => l.trim());
  if (nonEmpty.length < 2) return { headers: [], rows: [] };

  const headers = splitCsvLine(nonEmpty[0]).map(h => h.trim().toLowerCase());
  const rows    = nonEmpty.slice(1).map(splitCsvLine);

  return { headers, rows };
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function getCsvField(row: string[], headers: string[], field: string): string {
  const idx = headers.indexOf(field);
  return idx >= 0 ? (row[idx] ?? '').trim() : '';
}
