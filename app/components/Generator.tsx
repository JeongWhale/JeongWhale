'use client';

import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';
import { DropZone } from './DropZone';
import { PlanInput } from './PlanInput';
import { ResultsPanel } from './ResultsPanel';
import {
  fileToBase64,
  isSupportedMime,
  makeSessionId,
} from '@/app/lib/fileToBase64';
import type {
  AspectRatio,
  CardResultState,
  GenerateRequest,
  GenerateResponse,
  TemplateImage,
} from '@/app/lib/types';

export function Generator() {
  const [templates, setTemplates] = useState<File[]>([]);
  const [planText, setPlanText] = useState('');
  const [totalCards, setTotalCards] = useState(5);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [results, setResults] = useState<CardResultState[]>([]);
  const [busy, setBusy] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);

  // Cache encoded templates per session so retries don't re-read files.
  const encodedTemplatesRef = useRef<TemplateImage[] | null>(null);

  const encodeTemplates = useCallback(async (): Promise<TemplateImage[]> => {
    const out: TemplateImage[] = [];
    for (const f of templates) {
      if (!isSupportedMime(f.type)) {
        throw new Error(`지원하지 않는 형식: ${f.name} (${f.type})`);
      }
      const base64 = await fileToBase64(f);
      out.push({ mimeType: f.type, base64, name: f.name });
    }
    return out;
  }, [templates]);

  const generateOne = useCallback(
    async (
      sId: string,
      cardIndex: number,
      total: number,
      ratio: AspectRatio,
      plan: string,
      encoded: TemplateImage[],
    ): Promise<void> => {
      setResults((prev) =>
        prev.map((r) =>
          r.index === cardIndex ? { ...r, status: 'pending', error: undefined } : r,
        ),
      );

      const payload: GenerateRequest = {
        sessionId: sId,
        cardIndex,
        totalCards: total,
        aspectRatio: ratio,
        planText: plan,
        templates: encoded,
      };

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as GenerateResponse;
        if (!data.ok) {
          setResults((prev) =>
            prev.map((r) =>
              r.index === cardIndex
                ? { ...r, status: 'error', error: data.error }
                : r,
            ),
          );
          return;
        }
        setResults((prev) =>
          prev.map((r) =>
            r.index === cardIndex
              ? {
                  ...r,
                  status: 'done',
                  imageBase64: data.imageBase64,
                  relPath: data.relPath,
                  error: undefined,
                }
              : r,
          ),
        );
      } catch (err) {
        setResults((prev) =>
          prev.map((r) =>
            r.index === cardIndex
              ? {
                  ...r,
                  status: 'error',
                  error: err instanceof Error ? err.message : String(err),
                }
              : r,
          ),
        );
      }
    },
    [],
  );

  const handleGenerate = useCallback(async () => {
    setTopError(null);

    if (templates.length === 0) {
      setTopError('템플릿 이미지를 1장 이상 첨부해주세요.');
      return;
    }
    if (planText.trim().length === 0) {
      setTopError('기획안을 입력해주세요.');
      return;
    }

    setBusy(true);
    const sId = makeSessionId();
    setSessionId(sId);

    const initial: CardResultState[] = Array.from(
      { length: totalCards },
      (_, i) => ({ index: i + 1, status: 'idle' }),
    );
    setResults(initial);

    let encoded: TemplateImage[];
    try {
      encoded = await encodeTemplates();
      encodedTemplatesRef.current = encoded;
    } catch (err) {
      setTopError(err instanceof Error ? err.message : String(err));
      setBusy(false);
      return;
    }

    for (let i = 1; i <= totalCards; i++) {
      // Sequential — Nano Banana Pro is heavy and we want stable rate.
      // eslint-disable-next-line no-await-in-loop
      await generateOne(sId, i, totalCards, aspectRatio, planText, encoded);
    }

    setBusy(false);
  }, [
    templates,
    planText,
    totalCards,
    aspectRatio,
    encodeTemplates,
    generateOne,
  ]);

  const handleRetry = useCallback(
    async (cardIndex: number) => {
      if (!sessionId) return;
      let encoded = encodedTemplatesRef.current;
      if (!encoded) {
        try {
          encoded = await encodeTemplates();
          encodedTemplatesRef.current = encoded;
        } catch (err) {
          setTopError(err instanceof Error ? err.message : String(err));
          return;
        }
      }
      setBusy(true);
      await generateOne(
        sessionId,
        cardIndex,
        totalCards,
        aspectRatio,
        planText,
        encoded,
      );
      setBusy(false);
    },
    [
      sessionId,
      encodeTemplates,
      generateOne,
      totalCards,
      aspectRatio,
      planText,
    ],
  );

  return (
    <main className="layout">
      <section className="panel panel--inputs">
        <h1>
          인스타그램 카드뉴스 생성기
          <Link href="/payroll" className="top-nav-link">
            정산 계산기 →
          </Link>
        </h1>
        <p className="subtitle">
          템플릿 이미지를 스타일 레퍼런스로, 기획안을 콘텐츠로 사용해
          Gemini Nano Banana Pro로 카드뉴스를 만듭니다.
        </p>

        <h2>1. 템플릿 첨부</h2>
        <DropZone files={templates} setFiles={setTemplates} disabled={busy} />

        <h2>2. 기획안 작성</h2>
        <PlanInput
          planText={planText}
          setPlanText={setPlanText}
          totalCards={totalCards}
          setTotalCards={setTotalCards}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          disabled={busy}
        />

        {topError && <div className="banner banner--error">{topError}</div>}

        <button
          type="button"
          className="generate-btn"
          onClick={handleGenerate}
          disabled={busy}
        >
          {busy ? '생성 중…' : `카드 ${totalCards}장 생성`}
        </button>
      </section>

      <ResultsPanel
        results={results}
        sessionId={sessionId}
        onRetry={handleRetry}
        busy={busy}
      />
    </main>
  );
}
