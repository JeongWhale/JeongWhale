'use client';

import JSZip from 'jszip';
import type { CardResultState } from '@/app/lib/types';

interface ResultsPanelProps {
  results: CardResultState[];
  sessionId: string | null;
  onRetry: (cardIndex: number) => void;
  busy: boolean;
}

export function ResultsPanel({
  results,
  sessionId,
  onRetry,
  busy,
}: ResultsPanelProps) {
  const doneCount = results.filter((r) => r.status === 'done').length;
  const hasAnyDone = doneCount > 0;

  const downloadZip = async () => {
    if (!hasAnyDone || !sessionId) return;
    const zip = new JSZip();
    const folder = zip.folder(sessionId);
    if (!folder) return;
    for (const r of results) {
      if (r.status === 'done' && r.imageBase64) {
        const fname = `card-${String(r.index).padStart(2, '0')}.png`;
        folder.file(fname, r.imageBase64, { base64: true });
      }
    }
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sessionId}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="results">
      <header className="results__header">
        <h2>생성 결과</h2>
        <div className="results__meta">
          {results.length > 0 && (
            <span>
              {doneCount} / {results.length} 완료
            </span>
          )}
          <button
            type="button"
            onClick={downloadZip}
            disabled={!hasAnyDone || busy}
          >
            전체 ZIP 다운로드
          </button>
        </div>
      </header>

      {sessionId && (
        <p className="results__path">
          저장 경로: <code>outputs/{sessionId}/</code>
        </p>
      )}

      {results.length === 0 ? (
        <p className="results__empty">
          왼쪽에서 템플릿과 기획안을 입력하고 “생성” 버튼을 눌러주세요.
        </p>
      ) : (
        <ul className="card-grid">
          {results.map((r) => (
            <li key={r.index} className={`card card--${r.status}`}>
              <div className="card__index">card {r.index}</div>

              {r.status === 'pending' && (
                <div className="card__placeholder">
                  <div className="spinner" />
                  <span>생성 중…</span>
                </div>
              )}

              {r.status === 'idle' && (
                <div className="card__placeholder">
                  <span>대기 중</span>
                </div>
              )}

              {r.status === 'done' && r.imageBase64 && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="card__img"
                    src={`data:image/png;base64,${r.imageBase64}`}
                    alt={`card ${r.index}`}
                  />
                  <div className="card__actions">
                    <a
                      href={`data:image/png;base64,${r.imageBase64}`}
                      download={`card-${String(r.index).padStart(2, '0')}.png`}
                    >
                      PNG 다운로드
                    </a>
                    <button
                      type="button"
                      onClick={() => onRetry(r.index)}
                      disabled={busy}
                    >
                      재생성
                    </button>
                  </div>
                </>
              )}

              {r.status === 'error' && (
                <div className="card__error">
                  <strong>실패</strong>
                  <pre>{r.error}</pre>
                  <button
                    type="button"
                    onClick={() => onRetry(r.index)}
                    disabled={busy}
                  >
                    재시도
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
