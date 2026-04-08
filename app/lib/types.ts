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
