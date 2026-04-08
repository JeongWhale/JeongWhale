import type { SupportedMime } from './types';

const SUPPORTED: SupportedMime[] = ['image/png', 'image/jpeg', 'image/webp'];

export function isSupportedMime(mime: string): mime is SupportedMime {
  return (SUPPORTED as string[]).includes(mime);
}

export async function fileToBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + chunk) as unknown as number[],
    );
  }
  return btoa(binary);
}

export function makeSessionId(): string {
  // Filesystem-safe ISO-ish timestamp, e.g. 2026-04-08T12-30-00-123
  const d = new Date();
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}` +
    `-${pad(d.getMilliseconds(), 3)}`
  );
}
