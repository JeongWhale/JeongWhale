import { promises as fs } from 'node:fs';
import path from 'node:path';
import type {
  BrandToneIndex,
  BrandToneVersion,
  BrandToneVersionMeta,
} from './types';

const ROOT = path.join(process.cwd(), 'brand-tones');

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const VERSION_RE = /^v[0-9]{1,5}$/;

export class BrandToneError extends Error {}

export function isValidBrandId(s: unknown): s is string {
  return typeof s === 'string' && ID_RE.test(s);
}

function brandDir(brandId: string): string {
  if (!isValidBrandId(brandId)) {
    throw new BrandToneError('invalid brandId');
  }
  return path.join(ROOT, brandId);
}

async function readIndex(brandId: string): Promise<BrandToneIndex | null> {
  try {
    const buf = await fs.readFile(path.join(brandDir(brandId), 'index.json'), 'utf8');
    return JSON.parse(buf) as BrandToneIndex;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}

async function writeIndex(idx: BrandToneIndex): Promise<void> {
  const dir = brandDir(idx.brandId);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, 'index.json'),
    JSON.stringify(idx, null, 2) + '\n',
    'utf8',
  );
}

function nextVersionId(versions: BrandToneVersionMeta[]): string {
  const nums = versions
    .map((v) => Number(v.id.replace(/^v/, '')))
    .filter((n) => Number.isFinite(n));
  const next = nums.length === 0 ? 1 : Math.max(...nums) + 1;
  return `v${next}`;
}

export async function listBrands(): Promise<
  Array<{ brandId: string; current: string | null; versionCount: number }>
> {
  let entries: string[] = [];
  try {
    entries = await fs.readdir(ROOT);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
  const out: Array<{ brandId: string; current: string | null; versionCount: number }> = [];
  for (const name of entries) {
    if (!isValidBrandId(name)) continue;
    const idx = await readIndex(name);
    if (!idx) continue;
    out.push({
      brandId: name,
      current: idx.current,
      versionCount: idx.versions.length,
    });
  }
  return out.sort((a, b) => a.brandId.localeCompare(b.brandId));
}

export async function readBrand(
  brandId: string,
  versionId?: string,
): Promise<{
  index: BrandToneIndex;
  body: string | null;
  selectedVersion: string | null;
}> {
  const idx = await readIndex(brandId);
  if (!idx) {
    return {
      index: { brandId, current: null, versions: [] },
      body: null,
      selectedVersion: null,
    };
  }
  const target = versionId ?? idx.current;
  if (!target) {
    return { index: idx, body: null, selectedVersion: null };
  }
  if (!VERSION_RE.test(target)) {
    throw new BrandToneError('invalid versionId');
  }
  const body = await fs.readFile(
    path.join(brandDir(brandId), `${target}.md`),
    'utf8',
  );
  return { index: idx, body, selectedVersion: target };
}

export async function readVersion(brandId: string, versionId: string): Promise<BrandToneVersion> {
  if (!VERSION_RE.test(versionId)) {
    throw new BrandToneError('invalid versionId');
  }
  const idx = await readIndex(brandId);
  if (!idx) throw new BrandToneError('brand not found');
  const meta = idx.versions.find((v) => v.id === versionId);
  if (!meta) throw new BrandToneError('version not found');
  const body = await fs.readFile(
    path.join(brandDir(brandId), `${versionId}.md`),
    'utf8',
  );
  return { id: versionId, body, createdAt: meta.createdAt, note: meta.note };
}

export async function createVersion(args: {
  brandId: string;
  body: string;
  note?: string;
}): Promise<BrandToneVersion> {
  if (!isValidBrandId(args.brandId)) {
    throw new BrandToneError('invalid brandId');
  }
  if (typeof args.body !== 'string' || args.body.length === 0) {
    throw new BrandToneError('body is required');
  }
  if (args.body.length > 50_000) {
    throw new BrandToneError('body too long (>50000 chars)');
  }

  const dir = brandDir(args.brandId);
  await fs.mkdir(dir, { recursive: true });
  const idx =
    (await readIndex(args.brandId)) ?? {
      brandId: args.brandId,
      current: null,
      versions: [],
    };
  const id = nextVersionId(idx.versions);
  const createdAt = new Date().toISOString();
  await fs.writeFile(path.join(dir, `${id}.md`), args.body, 'utf8');
  idx.versions.push({ id, createdAt, note: args.note });
  idx.current = id;
  await writeIndex(idx);
  return { id, body: args.body, createdAt, note: args.note };
}

export async function setCurrent(args: {
  brandId: string;
  versionId: string;
}): Promise<BrandToneIndex> {
  if (!VERSION_RE.test(args.versionId)) {
    throw new BrandToneError('invalid versionId');
  }
  const idx = await readIndex(args.brandId);
  if (!idx) throw new BrandToneError('brand not found');
  if (!idx.versions.find((v) => v.id === args.versionId)) {
    throw new BrandToneError('version not found');
  }
  idx.current = args.versionId;
  await writeIndex(idx);
  return idx;
}

export async function getEffectiveTone(args: {
  brandId?: string;
  versionId?: string;
}): Promise<{ body: string; versionId: string | null }> {
  if (!args.brandId) return { body: '', versionId: null };
  try {
    const { body, selectedVersion } = await readBrand(args.brandId, args.versionId);
    return { body: body ?? '', versionId: selectedVersion };
  } catch {
    return { body: '', versionId: null };
  }
}
