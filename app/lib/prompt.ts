import type { AspectRatio } from './types';

export function buildCardPrompt(args: {
  planText: string;
  cardIndex: number;
  totalCards: number;
  aspectRatio: AspectRatio;
}): string {
  const { planText, cardIndex, totalCards, aspectRatio } = args;
  return `You are designing an Instagram-style Korean card-news carousel.

STYLE / LAYOUT REFERENCE:
The attached image(s) are STYLE and LAYOUT references only. Match their visual tone:
typography hierarchy, color palette, spacing, decorative elements, illustration style.
Do NOT reproduce their text content or photographic subjects. Create an ORIGINAL image
that fits the new content plan below.

OUTPUT REQUIREMENTS:
- Aspect ratio: ${aspectRatio} (mandatory; render the canvas at exactly this ratio).
- This is card ${cardIndex} of ${totalCards} in a sequential carousel.
  Make it visually consistent with the other cards (same palette, fonts, layout grid).
- Render ALL Korean text crisply, with correct spelling and proper word spacing.
- High resolution, print-quality, no watermarks, no UI chrome, no borders.
- A single flat image (no multi-panel collage unless the plan asks for it).

CONTENT PLAN (Korean Markdown — full carousel context):
"""
${planText}
"""

YOUR TASK:
Generate ONLY card ${cardIndex} of ${totalCards}. Use the section of the plan that
corresponds to this card index. If the plan does not explicitly partition cards,
infer a sensible split:
  - card 1 = hook / title
  - card ${totalCards} = CTA / summary
  - middle cards = body points in order

Return a single image. Do not return text.`;
}
