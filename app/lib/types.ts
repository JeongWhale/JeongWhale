export type AspectRatio = '1:1' | '4:5' | '9:16';

export const ASPECT_RATIOS: AspectRatio[] = ['1:1', '4:5', '9:16'];

export type SupportedMime = 'image/png' | 'image/jpeg' | 'image/webp';

export interface TemplateImage {
  mimeType: SupportedMime;
  base64: string;
  name: string;
}

export interface GenerateRequest {
  sessionId: string;
  cardIndex: number;
  totalCards: number;
  aspectRatio: AspectRatio;
  planText: string;
  templates: TemplateImage[];
}

export type GenerateResponse =
  | {
      ok: true;
      cardIndex: number;
      relPath: string;
      imageBase64: string;
      mimeType: 'image/png';
    }
  | {
      ok: false;
      cardIndex: number;
      error: string;
    };

export interface CardResultState {
  index: number;
  status: 'idle' | 'pending' | 'done' | 'error';
  imageBase64?: string;
  relPath?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Plan generation pipeline
// ---------------------------------------------------------------------------

export type Provider = 'claude' | 'gemini';
export type PlanFormat = 'carousel' | 'reels';

export interface BrandToneVersionMeta {
  id: string; // 'v1', 'v2', ...
  createdAt: string;
  note?: string;
}

export interface BrandToneIndex {
  brandId: string;
  current: string | null;
  versions: BrandToneVersionMeta[];
}

export interface BrandToneVersion {
  id: string;
  body: string; // markdown
  createdAt: string;
  note?: string;
}

export interface TopicCandidate {
  topic: string;
  angle: string;
  why: string;
}

export interface ResearchFinding {
  claim: string;
  evidence: string;
  sourceIdx: number;
}

export interface ResearchSource {
  url: string;
  title: string;
}

export interface ResearchResult {
  query: string;
  findings: ResearchFinding[];
  sources: ResearchSource[];
}

export interface Brief {
  keyInsights: string[];
  angles: string[];
  painPoints: string[];
  doNotMention: string[];
}

export interface CarouselCard {
  index: number;
  role: 'hook' | 'body' | 'cta';
  title: string;
  bodyBullets: string[];
  visualCue: string;
}

export interface CarouselPlan {
  format: 'carousel';
  topic: string;
  brandToneVersion: string | null;
  research: ResearchResult | null;
  brief: Brief;
  cards: CarouselCard[];
  caption: string;
  hashtags: string[];
  markdownPlan: string;
}

export interface ReelsScene {
  timeSec: number;
  voiceover: string;
  onScreenText: string;
  bRoll: string;
  transition?: string;
}

export interface ReelsHook {
  primary: string;
  alternates: string[];
}

export interface ReelsPlan {
  format: 'reels';
  topic: string;
  brandToneVersion: string | null;
  research: ResearchResult | null;
  brief: Brief;
  hook: ReelsHook;
  scenes: ReelsScene[];
  caption: string;
  hashtags: string[];
}

export type Plan = CarouselPlan | ReelsPlan;

// ---------------------------------------------------------------------------
// API contracts (plan pipeline)
// ---------------------------------------------------------------------------

export interface TopicsRequest {
  provider: Provider;
  brandId?: string;
  brandToneVersion?: string; // defaults to current
  direction?: string; // 사용자 방향성 한 줄
  count?: number;
}

export type TopicsResponse =
  | { ok: true; candidates: TopicCandidate[] }
  | { ok: false; error: string; failedSkill?: string };

export interface ResearchRequest {
  brandId?: string;
  brandToneVersion?: string;
  topic: string;
}

export type ResearchApiResponse =
  | { ok: true; research: ResearchResult }
  | { ok: false; error: string; failedSkill?: string };

export interface PlanRequest {
  format: PlanFormat;
  provider: Provider;
  topic: string;
  brandId?: string;
  brandToneVersion?: string;
  research?: ResearchResult;
  cardCount?: number; // carousel only
  aspectRatio?: AspectRatio; // carousel only
  durationSec?: number; // reels only
}

export type PlanResponse =
  | { ok: true; plan: Plan }
  | { ok: false; error: string; failedSkill?: string };

// brand-tone API

export interface BrandToneListResponse {
  brands: Array<{ brandId: string; current: string | null; versionCount: number }>;
}

export interface BrandToneReadResponse {
  ok: true;
  brandId: string;
  current: string | null;
  versions: BrandToneVersionMeta[];
  body: string | null;
  selectedVersion: string | null;
}

export interface BrandToneCreateRequest {
  brandId: string;
  body: string;
  note?: string;
}

export interface BrandToneSetCurrentRequest {
  brandId: string;
  versionId: string;
}
