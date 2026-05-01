import { NextRequest, NextResponse } from 'next/server';
import {
  BrandToneError,
  createVersion,
  isValidBrandId,
  listBrands,
  readBrand,
  setCurrent,
} from '@/app/lib/brandTone';
import type {
  BrandToneCreateRequest,
  BrandToneListResponse,
  BrandToneReadResponse,
  BrandToneSetCurrentRequest,
} from '@/app/lib/types';

export const runtime = 'nodejs';

function err(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const brandId = url.searchParams.get('brandId');
  const versionId = url.searchParams.get('versionId') ?? undefined;

  if (!brandId) {
    const brands = await listBrands();
    return NextResponse.json<BrandToneListResponse>({ brands });
  }
  if (!isValidBrandId(brandId)) return err('invalid brandId');

  try {
    const { index, body, selectedVersion } = await readBrand(brandId, versionId);
    return NextResponse.json<BrandToneReadResponse>({
      ok: true,
      brandId,
      current: index.current,
      versions: index.versions,
      body,
      selectedVersion,
    });
  } catch (e) {
    return err(e instanceof Error ? e.message : 'read failed', 500);
  }
}

export async function POST(req: NextRequest) {
  let body: BrandToneCreateRequest;
  try {
    body = (await req.json()) as BrandToneCreateRequest;
  } catch {
    return err('invalid json');
  }
  try {
    const v = await createVersion(body);
    return NextResponse.json({ ok: true, version: v });
  } catch (e) {
    if (e instanceof BrandToneError) return err(e.message);
    return err(e instanceof Error ? e.message : 'create failed', 500);
  }
}

export async function PATCH(req: NextRequest) {
  let body: BrandToneSetCurrentRequest;
  try {
    body = (await req.json()) as BrandToneSetCurrentRequest;
  } catch {
    return err('invalid json');
  }
  try {
    const idx = await setCurrent(body);
    return NextResponse.json({ ok: true, index: idx });
  } catch (e) {
    if (e instanceof BrandToneError) return err(e.message);
    return err(e instanceof Error ? e.message : 'patch failed', 500);
  }
}
