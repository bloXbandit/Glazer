// ============================================================
// CLIENT DOCUMENTS — contracts, accepted bids, historical files
// POST multipart/form-data: file + client_id + doc_type/title/doc_date/notes
// GET ?client_id=…  → metadata list
// GET ?id=…         → file download (streams the stored blob)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  saveClientDocument, listClientDocuments, getClientDocument, getClient,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB per document
const ALLOWED_MIME_PREFIXES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument', // docx/xlsx
  'application/vnd.ms-excel',
  'image/png', 'image/jpeg', 'image/heic', 'image/webp',
  'text/plain', 'text/csv',
];
const DOC_TYPES = ['contract', 'accepted_bid', 'estimate', 'other'];

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
  }

  const file = form.get('file');
  const clientId = (form.get('client_id') as string) ?? '';
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }
  if (!clientId || !getClient(clientId)) {
    return NextResponse.json({ error: 'Valid client_id required — documents attach to a client' }, { status: 400 });
  }

  const f = file as File;
  if (f.size > MAX_BYTES) {
    return NextResponse.json({ error: `File too large (max ${MAX_BYTES / 1024 / 1024} MB)` }, { status: 413 });
  }
  const mime = f.type || 'application/octet-stream';
  if (!ALLOWED_MIME_PREFIXES.some(p => mime.startsWith(p))) {
    return NextResponse.json({ error: `Unsupported file type: ${mime}. PDF, Word, Excel, images, or text.` }, { status: 415 });
  }

  const docTypeRaw = (form.get('doc_type') as string) ?? 'other';
  const docType = DOC_TYPES.includes(docTypeRaw) ? docTypeRaw : 'other';
  const title = ((form.get('title') as string) || f.name).slice(0, 200);
  const docDate = (form.get('doc_date') as string) || null;
  const notes = ((form.get('notes') as string) || '').slice(0, 1000) || null;

  const buffer = Buffer.from(await f.arrayBuffer());
  const meta = saveClientDocument({
    client_id: clientId,
    doc_type: docType,
    title,
    filename: f.name,
    mime,
    doc_date: docDate,
    notes,
    buffer,
  });

  return NextResponse.json({ ok: true, document: meta });
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (id) {
    const doc = getClientDocument(id);
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return new NextResponse(new Uint8Array(doc.data), {
      headers: {
        'Content-Type': doc.mime,
        'Content-Disposition': `attachment; filename="${doc.filename.replace(/"/g, '')}"`,
        'Content-Length': String(doc.size_bytes),
      },
    });
  }

  const clientId = req.nextUrl.searchParams.get('client_id');
  if (!clientId) {
    return NextResponse.json({ error: 'client_id or id required' }, { status: 400 });
  }
  return NextResponse.json({ documents: listClientDocuments(clientId) });
}
