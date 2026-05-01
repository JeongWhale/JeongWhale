'use client';

import { useCallback, useRef, useState } from 'react';
import { DropZone } from './DropZone';
import { PlanInput } from './PlanInput';
import { PlanGenerator } from './PlanGenerator';
import { ReelsResult } from './ReelsResult';
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
  ReelsPlan,
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
  const [reelsPlan, setReelsPlan] = useState<ReelsPlan | null>(null);

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
        <h1>인스타그램 기획안 + 카드뉴스 생성기</h1>
        <p className="subtitle">
          브랜드 톤을 학습한 다단계 스킬 파이프라인이 캐러셀/릴스 기획안을 만들고,
          캐러셀은 그대로 Gemini Nano Banana Pro로 카드 이미지까지 이어집니다.
        </p>

        <PlanGenerator
          totalCards={totalCards}
          setTotalCards={setTotalCards}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          setPlanText={setPlanText}
          setReelsPlan={setReelsPlan}
          disabled={busy}
        />

        <h2>4. 템플릿 첨부 (캐러셀)</h2>
        <DropZone files={templates} setFiles={setTemplates} disabled={busy} />

        <h2>5. 기획안 (자동 채움 / 직접 편집 가능)</h2>
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

      <section className="panel-right">
        {reelsPlan ? (
          <ReelsResult plan={reelsPlan} />
        ) : (
          <ResultsPanel
            results={results}
            sessionId={sessionId}
            onRetry={handleRetry}
            busy={busy}
          />
        )}
      </section>
    </main>
  );
}
