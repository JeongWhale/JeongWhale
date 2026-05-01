'use client';

import { useCallback, useEffect, useState } from 'react';
import type {
  BrandToneListResponse,
  BrandToneReadResponse,
  BrandToneVersionMeta,
} from '@/app/lib/types';

interface Props {
  brandId: string;
  setBrandId: (s: string) => void;
  selectedVersion: string | null;
  setSelectedVersion: (v: string | null) => void;
  disabled?: boolean;
}

export function BrandTonePanel({
  brandId,
  setBrandId,
  selectedVersion,
  setSelectedVersion,
  disabled,
}: Props) {
  const [brands, setBrands] = useState<BrandToneListResponse['brands']>([]);
  const [versions, setVersions] = useState<BrandToneVersionMeta[]>([]);
  const [body, setBody] = useState('');
  const [note, setNote] = useState('');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBrands = useCallback(async () => {
    try {
      const res = await fetch('/api/brand-tone');
      const data = (await res.json()) as BrandToneListResponse;
      setBrands(data.brands);
    } catch (e) {
      setError(e instanceof Error ? e.message : '브랜드 목록 로드 실패');
    }
  }, []);

  const loadBrand = useCallback(
    async (id: string, version?: string) => {
      if (!id) return;
      setError(null);
      try {
        const url = new URL('/api/brand-tone', window.location.origin);
        url.searchParams.set('brandId', id);
        if (version) url.searchParams.set('versionId', version);
        const res = await fetch(url.toString());
        const data = (await res.json()) as BrandToneReadResponse | { ok: false; error: string };
        if ('ok' in data && data.ok === false) {
          setError(data.error);
          return;
        }
        const ok = data as BrandToneReadResponse;
        setVersions(ok.versions);
        setBody(ok.body ?? '');
        setSelectedVersion(ok.selectedVersion);
      } catch (e) {
        setError(e instanceof Error ? e.message : '브랜드 톤 로드 실패');
      }
    },
    [setSelectedVersion],
  );

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  useEffect(() => {
    if (brandId) loadBrand(brandId);
    else {
      setVersions([]);
      setBody('');
      setSelectedVersion(null);
    }
  }, [brandId, loadBrand, setSelectedVersion]);

  const onChangeVersion = async (v: string) => {
    setSelectedVersion(v);
    await loadBrand(brandId, v);
  };

  const onSaveVersion = async () => {
    if (!brandId) {
      setError('브랜드 ID를 입력해주세요.');
      return;
    }
    if (body.trim().length === 0) {
      setError('내용을 입력해주세요.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/brand-tone', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ brandId, body, note: note || undefined }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error ?? 'save failed');
      setEditing(false);
      setNote('');
      await loadBrands();
      await loadBrand(brandId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'save failed');
    } finally {
      setBusy(false);
    }
  };

  const onSetCurrent = async () => {
    if (!brandId || !selectedVersion) return;
    setBusy(true);
    try {
      await fetch('/api/brand-tone', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ brandId, versionId: selectedVersion }),
      });
      await loadBrand(brandId, selectedVersion);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'set current failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="brand-tone">
      <div className="row">
        <label className="field field--inline">
          <span className="field__label">브랜드 ID</span>
          <input
            className="field__number"
            list="brand-tone-list"
            placeholder="예: my_brand"
            value={brandId}
            onChange={(e) =>
              setBrandId(e.target.value.replace(/[^A-Za-z0-9_-]/g, ''))
            }
            disabled={disabled || busy}
          />
          <datalist id="brand-tone-list">
            {brands.map((b) => (
              <option key={b.brandId} value={b.brandId} />
            ))}
          </datalist>
        </label>

        <label className="field field--inline">
          <span className="field__label">버전</span>
          <select
            className="field__select"
            value={selectedVersion ?? ''}
            onChange={(e) => onChangeVersion(e.target.value)}
            disabled={disabled || busy || versions.length === 0}
          >
            {versions.length === 0 ? (
              <option value="">(없음)</option>
            ) : (
              versions
                .slice()
                .reverse()
                .map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.id}
                    {v.note ? ` — ${v.note}` : ''}
                  </option>
                ))
            )}
          </select>
        </label>
      </div>

      {!editing ? (
        <div className="brand-tone__view">
          <pre className="brand-tone__body">
            {body || '(브랜드 톤이 비어 있습니다. 편집을 눌러 v1을 만들어주세요.)'}
          </pre>
          <div className="brand-tone__actions">
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={disabled || busy || !brandId}
            >
              {body ? '신규 버전 작성' : '톤 사전 작성'}
            </button>
            <button
              type="button"
              onClick={onSetCurrent}
              disabled={
                disabled ||
                busy ||
                !brandId ||
                !selectedVersion ||
                versions.find((v) => v.id === selectedVersion)?.id === undefined
              }
            >
              이 버전을 current로
            </button>
          </div>
        </div>
      ) : (
        <div className="brand-tone__edit">
          <textarea
            className="field__textarea"
            rows={10}
            placeholder={`예시:
# 브랜드 톤 사전 v1

## 페르소나
30대 직장인을 향한 친근한 선배

## 말투
- 반말 X, 부드러운 존댓말
- 이모지 최소화 (1~2개)

## 자주 쓰는 표현
- "오늘은 ~을 알려드릴게요"

## 금기어
- "꿀팁", "갓생"`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={busy}
          />
          <input
            className="field__number"
            placeholder="버전 메모 (선택)"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 80))}
            disabled={busy}
          />
          <div className="brand-tone__actions">
            <button
              type="button"
              onClick={onSaveVersion}
              disabled={busy}
              className="generate-btn generate-btn--small"
            >
              {busy ? '저장 중…' : '신규 버전으로 저장'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                if (brandId) loadBrand(brandId, selectedVersion ?? undefined);
              }}
              disabled={busy}
            >
              취소
            </button>
          </div>
        </div>
      )}

      {error && <div className="banner banner--error">{error}</div>}
    </div>
  );
}
