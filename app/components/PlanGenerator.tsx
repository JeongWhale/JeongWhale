'use client';

import { useState } from 'react';
import { BrandTonePanel } from './BrandTonePanel';
import { TopicIdeation } from './TopicIdeation';
import { ResearchView } from './ResearchView';
import {
  ASPECT_RATIOS,
  type AspectRatio,
  type CarouselPlan,
  type PlanFormat,
  type PlanRequest,
  type PlanResponse,
  type Provider,
  type ReelsPlan,
  type ResearchResult,
} from '@/app/lib/types';

interface Props {
  totalCards: number;
  setTotalCards: (n: number) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (a: AspectRatio) => void;
  setPlanText: (s: string) => void;
  setReelsPlan: (p: ReelsPlan | null) => void;
  disabled?: boolean;
}

export function PlanGenerator({
  totalCards,
  setTotalCards,
  aspectRatio,
  setAspectRatio,
  setPlanText,
  setReelsPlan,
  disabled,
}: Props) {
  const [brandId, setBrandId] = useState('');
  const [brandToneVersion, setBrandToneVersion] = useState<string | null>(null);
  const [provider, setProvider] = useState<Provider>('claude');
  const [format, setFormat] = useState<PlanFormat>('carousel');
  const [topic, setTopic] = useState('');
  const [research, setResearch] = useState<ResearchResult | null>(null);
  const [durationSec, setDurationSec] = useState(30);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCarousel, setLastCarousel] = useState<CarouselPlan | null>(null);

  const generatePlan = async () => {
    if (!topic.trim()) {
      setError('주제를 정해주세요.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const req: PlanRequest = {
        format,
        provider,
        topic,
        brandId: brandId || undefined,
        brandToneVersion: brandToneVersion || undefined,
        research: research ?? undefined,
        cardCount: format === 'carousel' ? totalCards : undefined,
        aspectRatio: format === 'carousel' ? aspectRatio : undefined,
        durationSec: format === 'reels' ? durationSec : undefined,
      };
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(req),
      });
      const data = (await res.json()) as PlanResponse;
      if (!data.ok) throw new Error(`${data.failedSkill ?? '?'}: ${data.error}`);

      if (data.plan.format === 'carousel') {
        setLastCarousel(data.plan);
        setPlanText(data.plan.markdownPlan);
        setReelsPlan(null);
      } else {
        setReelsPlan(data.plan);
        setLastCarousel(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'plan failed');
    } finally {
      setBusy(false);
    }
  };

  const stepDisabled = disabled || busy;

  return (
    <div className="plan-generator">
      <h2>0. 브랜드 톤 사전</h2>
      <BrandTonePanel
        brandId={brandId}
        setBrandId={setBrandId}
        selectedVersion={brandToneVersion}
        setSelectedVersion={setBrandToneVersion}
        disabled={stepDisabled}
      />

      <h2>1. 주제 정하기</h2>
      <div className="row">
        <label className="field field--inline">
          <span className="field__label">포맷</span>
          <select
            className="field__select"
            value={format}
            onChange={(e) => setFormat(e.target.value as PlanFormat)}
            disabled={stepDisabled}
          >
            <option value="carousel">캐러셀 (카드뉴스)</option>
            <option value="reels">릴스</option>
          </select>
        </label>
        <label className="field field--inline">
          <span className="field__label">모델</span>
          <select
            className="field__select"
            value={provider}
            onChange={(e) => setProvider(e.target.value as Provider)}
            disabled={stepDisabled}
          >
            <option value="claude">Claude</option>
            <option value="gemini">Gemini</option>
          </select>
        </label>
      </div>
      <TopicIdeation
        provider={provider}
        brandId={brandId}
        brandToneVersion={brandToneVersion}
        topic={topic}
        setTopic={setTopic}
        disabled={stepDisabled}
      />

      <h2>2. 자료조사</h2>
      <ResearchView
        topic={topic}
        brandId={brandId}
        brandToneVersion={brandToneVersion}
        research={research}
        setResearch={setResearch}
        disabled={stepDisabled}
      />

      <h2>3. 기획안 생성</h2>
      <div className="row">
        {format === 'carousel' ? (
          <>
            <label className="field field--inline">
              <span className="field__label">카드 수</span>
              <input
                className="field__number"
                type="number"
                min={1}
                max={10}
                value={totalCards}
                onChange={(e) =>
                  setTotalCards(
                    Math.max(1, Math.min(10, Number(e.target.value) || 1)),
                  )
                }
                disabled={stepDisabled}
              />
            </label>
            <label className="field field--inline">
              <span className="field__label">종횡비</span>
              <select
                className="field__select"
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                disabled={stepDisabled}
              >
                {ASPECT_RATIOS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <label className="field field--inline">
            <span className="field__label">길이(초)</span>
            <input
              className="field__number"
              type="number"
              min={10}
              max={90}
              value={durationSec}
              onChange={(e) =>
                setDurationSec(
                  Math.max(10, Math.min(90, Number(e.target.value) || 30)),
                )
              }
              disabled={stepDisabled}
            />
          </label>
        )}
      </div>

      <button
        type="button"
        className="generate-btn generate-btn--small"
        onClick={generatePlan}
        disabled={stepDisabled || !topic.trim()}
      >
        {busy ? '기획안 생성 중…' : `${format === 'carousel' ? '캐러셀' : '릴스'} 기획안 생성`}
      </button>

      {error && <div className="banner banner--error">{error}</div>}

      {lastCarousel && (
        <p className="plan-generator__note">
          캐러셀 기획안이 아래 “기획안” 영역에 자동으로 채워졌습니다. 검토 후 템플릿을 첨부하고
          이미지 생성을 진행하세요.
        </p>
      )}
    </div>
  );
}
