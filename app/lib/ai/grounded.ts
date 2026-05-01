import { GoogleGenAI } from '@google/genai';
import { runJSON, SkillError } from './client';
import type { ResearchFinding, ResearchResult, ResearchSource } from '@/app/lib/types';

const GROUNDED_MODEL = 'gemini-2.5-flash';

interface SubQueryPlan {
  subQueries: string[];
}

async function expandQuery(topic: string, brandTone: string): Promise<string[]> {
  const out = await runJSON<SubQueryPlan>({
    provider: 'gemini',
    schemaName: 'subQueryPlan',
    schemaDescription: 'A short list of focused sub-queries to research the topic from multiple angles.',
    schema: {
      type: 'object',
      required: ['subQueries'],
      properties: {
        subQueries: {
          type: 'array',
          items: { type: 'string' },
          description:
            '3 ~ 5 distinct, narrow Korean search queries that together cover the topic. Each <= 60 chars.',
        },
      },
    },
    system: [
      brandTone ? `<brand_tone>\n${brandTone}\n</brand_tone>\n` : '',
      'You generate Korean web-search sub-queries for Instagram content research.',
      'Cover different angles: definitions, statistics, recent trends, expert opinions, common pitfalls.',
      'Return only the JSON tool call.',
    ].join('\n'),
    user: `주제: ${topic}\n\n위 주제에 대해 인스타그램 카드뉴스/릴스 기획에 도움이 될 한국어 검색 쿼리 3~5개를 만들어줘.`,
    maxOutputTokens: 1024,
  });
  return out.subQueries.slice(0, 5);
}

interface RawGroundedResult {
  text: string;
  sources: ResearchSource[];
}

async function searchOnce(query: string): Promise<RawGroundedResult> {
  if (!process.env.GEMINI_API_KEY) {
    throw new SkillError('deepResearch', 'GEMINI_API_KEY is not set');
  }
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const resp = await ai.models.generateContent({
    model: GROUNDED_MODEL,
    contents: [{ role: 'user', parts: [{ text: query }] }],
    config: {
      systemInstruction:
        '당신은 한국어 웹 리서치 어시스턴트입니다. 주어진 쿼리에 대한 핵심 사실, 통계, 최근 트렌드를 3~6개의 짧은 한국어 문단으로 정리하세요. 각 사실에 출처를 명확히 연결하고, 추측은 피하세요.',
      tools: [{ googleSearch: {} }],
      // Padding for thinking tokens on 2.5 models.
      maxOutputTokens: 8192,
    },
  });

  const candidate = resp.candidates?.[0];
  const text =
    candidate?.content?.parts?.map((p) => p.text ?? '').join('\n').trim() ?? '';
  const grounding = candidate?.groundingMetadata;
  const chunks = grounding?.groundingChunks ?? [];
  const sources: ResearchSource[] = chunks
    .map((c) => {
      const w = c.web;
      if (!w?.uri) return null;
      return { url: w.uri, title: w.title ?? w.uri };
    })
    .filter((s): s is ResearchSource => s !== null);

  return { text, sources };
}

interface ConsolidatedFindings {
  findings: ResearchFinding[];
}

export async function deepResearch(args: {
  topic: string;
  brandTone: string;
}): Promise<ResearchResult> {
  const { topic, brandTone } = args;

  const subs = await expandQuery(topic, brandTone);

  const raws = await Promise.all(subs.map((q) => searchOnce(q).catch(() => null)));
  const successful = raws.filter((r): r is RawGroundedResult => r !== null);

  // Dedupe sources by url and build a stable index map.
  const sourceMap = new Map<string, number>();
  const sources: ResearchSource[] = [];
  for (const r of successful) {
    for (const s of r.sources) {
      if (!sourceMap.has(s.url)) {
        sourceMap.set(s.url, sources.length);
        sources.push(s);
      }
    }
  }

  // If grounded calls returned text but no sources at all, still try to consolidate
  // — the consolidator will produce findings with sourceIdx = -1 which we filter out.
  const corpus = successful
    .map((r, i) => `<doc q="${subs[i] ?? ''}">\n${r.text}\n</doc>`)
    .join('\n\n');

  if (!corpus) {
    return { query: topic, findings: [], sources };
  }

  const sourceList = sources
    .map((s, i) => `[${i}] ${s.title} — ${s.url}`)
    .join('\n');

  const consolidated = await runJSON<ConsolidatedFindings>({
    provider: 'gemini',
    schemaName: 'researchFindings',
    schemaDescription: 'Consolidated factual findings with source indices.',
    schema: {
      type: 'object',
      required: ['findings'],
      properties: {
        findings: {
          type: 'array',
          items: {
            type: 'object',
            required: ['claim', 'evidence', 'sourceIdx'],
            properties: {
              claim: { type: 'string', description: '한 문장 핵심 주장 (한국어)' },
              evidence: { type: 'string', description: '근거 (수치·인용 포함)' },
              sourceIdx: {
                type: 'integer',
                description: 'sources 배열의 인덱스. 출처 없으면 -1.',
              },
            },
          },
        },
      },
    },
    system:
      '당신은 한국어 콘텐츠 기획용 리서치를 통합 정리합니다. 중복 제거, 모순 표시, 추측 금지.',
    user: [
      brandTone ? `<brand_tone>\n${brandTone}\n</brand_tone>\n` : '',
      `주제: ${topic}`,
      '',
      '아래 그라운디드 검색 결과를 5~10개의 핵심 findings로 통합해줘. 각 finding은 sources 인덱스를 정확히 매핑할 것.',
      '',
      '## sources',
      sourceList || '(없음)',
      '',
      '## raw',
      corpus,
    ].join('\n'),
    maxOutputTokens: 3072,
  });

  const safeFindings = consolidated.findings.filter(
    (f) => f.sourceIdx === -1 || (f.sourceIdx >= 0 && f.sourceIdx < sources.length),
  );

  return { query: topic, findings: safeFindings, sources };
}
