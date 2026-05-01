'use client';

import { useCallback, useEffect, useState } from 'react';
import type {
  BrandToneListResponse,
  BrandToneReadResponse,
  BrandToneVersionMeta,
  Provider,
} from '@/app/lib/types';

interface Props {
  brandId: string;
  setBrandId: (s: string) => void;
  selectedVersion: string | null;
  setSelectedVersion: (v: string | null) => void;
  draftProvider: Provider;
  disabled?: boolean;
}

type Speech = 'casual' | 'polite' | 'mixed';

export function BrandTonePanel({
  brandId,
  setBrandId,
  selectedVersion,
  setSelectedVersion,
  draftProvider,
  disabled,
}: Props) {
  const [brands, setBrands] = useState<BrandToneListResponse['brands']>([]);
  const [versions, setVersions] = useState<BrandToneVersionMeta[]>([]);
  const [body, setBody] = useState('');
  const [note, setNote] = useState('');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [draftOpen, setDraftOpen] = useState(false);
  const [draftBusy, setDraftBusy] = useState(false);
  const [draft, setDraft] = useState({
    brandName: '',
    oneLiner: '',
    audience: '',
    speech: 'polite' as Speech,
    vibe: '',
    avoid: '',
    samples: '',
  });

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

  const onAIDraft = async () => {
    setDraftBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/brand-tone/draft', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          provider: draftProvider,
          brandName: draft.brandName || undefined,
          oneLiner: draft.oneLiner || undefined,
          audience: draft.audience || undefined,
          speech: draft.speech,
          vibe: draft.vibe || undefined,
          avoid: draft.avoid || undefined,
          samples: draft.samples || undefined,
          existingBody: body || undefined,
        }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(`${data.failedSkill ?? '?'}: ${data.error}`);
      setBody(data.markdown as string);
      setEditing(true);
      setDraftOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : '초안 생성 실패');
    } finally {
      setDraftBusy(false);
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
            {body || '(브랜드 톤이 비어 있습니다. 편집 또는 AI 초안으로 v1을 만들어주세요.)'}
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
              onClick={() => setDraftOpen((v) => !v)}
              disabled={disabled || busy || draftBusy || !brandId}
            >
              {draftOpen ? 'AI 초안 닫기' : 'AI 초안 만들기'}
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

          {draftOpen && (
            <div className="brand-tone__draft">
              <p className="brand-tone__draft-hint">
                Q&amp;A 또는 샘플 텍스트를 채우면 LLM이 마크다운 초안을 만들어
                편집 영역에 채워넣습니다. 저장은 직접 눌러야 v{(versions.length || 0) + 1}로 기록됩니다.
              </p>
              <div className="row">
                <label className="field field--inline">
                  <span className="field__label">브랜드명</span>
                  <input
                    className="field__number"
                    value={draft.brandName}
                    onChange={(e) =>
                      setDraft({ ...draft, brandName: e.target.value.slice(0, 200) })
                    }
                    disabled={draftBusy}
                  />
                </label>
                <label className="field field--inline">
                  <span className="field__label">말투</span>
                  <select
                    className="field__select"
                    value={draft.speech}
                    onChange={(e) =>
                      setDraft({ ...draft, speech: e.target.value as Speech })
                    }
                    disabled={draftBusy}
                  >
                    <option value="polite">존댓말</option>
                    <option value="casual">반말/구어체</option>
                    <option value="mixed">혼합</option>
                  </select>
                </label>
              </div>
              <label className="field">
                <span className="field__label">한 줄 소개</span>
                <input
                  className="field__number"
                  placeholder="예: 30대 직장인을 위한 실용 노하우 큐레이션"
                  value={draft.oneLiner}
                  onChange={(e) =>
                    setDraft({ ...draft, oneLiner: e.target.value.slice(0, 300) })
                  }
                  disabled={draftBusy}
                />
              </label>
              <label className="field">
                <span className="field__label">타겟</span>
                <input
                  className="field__number"
                  placeholder="예: 30대 직장인, 자기계발에 관심"
                  value={draft.audience}
                  onChange={(e) =>
                    setDraft({ ...draft, audience: e.target.value.slice(0, 300) })
                  }
                  disabled={draftBusy}
                />
              </label>
              <label className="field">
                <span className="field__label">분위기/무드</span>
                <input
                  className="field__number"
                  placeholder="예: 미니멀, 따뜻함, 신뢰감"
                  value={draft.vibe}
                  onChange={(e) =>
                    setDraft({ ...draft, vibe: e.target.value.slice(0, 300) })
                  }
                  disabled={draftBusy}
                />
              </label>
              <label className="field">
                <span className="field__label">피하고 싶은 표현</span>
                <input
                  className="field__number"
                  placeholder="예: 꿀팁, 갓생, 과도한 이모지"
                  value={draft.avoid}
                  onChange={(e) =>
                    setDraft({ ...draft, avoid: e.target.value.slice(0, 300) })
                  }
                  disabled={draftBusy}
                />
              </label>
              <label className="field">
                <span className="field__label">샘플 텍스트 (기존 게시물 등, 선택)</span>
                <textarea
                  className="field__textarea"
                  rows={6}
                  placeholder="기존 인스타 캡션 / 블로그 글을 붙여넣으면 말투를 역추적합니다."
                  value={draft.samples}
                  onChange={(e) =>
                    setDraft({ ...draft, samples: e.target.value.slice(0, 20_000) })
                  }
                  disabled={draftBusy}
                />
              </label>
              <div className="brand-tone__actions">
                <button
                  type="button"
                  className="generate-btn generate-btn--small"
                  onClick={onAIDraft}
                  disabled={draftBusy}
                >
                  {draftBusy
                    ? '초안 생성 중…'
                    : body
                      ? '현재 톤을 개선해 초안 만들기'
                      : '초안 생성 (편집기로 채움)'}
                </button>
                <button
                  type="button"
                  onClick={() => setDraftOpen(false)}
                  disabled={draftBusy}
                >
                  닫기
                </button>
              </div>
            </div>
          )}
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
