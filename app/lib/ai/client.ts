import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI, Type } from '@google/genai';
import type { Provider } from '@/app/lib/types';

const CLAUDE_MODEL = 'claude-sonnet-4-5-20250929';
const GEMINI_TEXT_MODEL = 'gemini-2.5-flash';

export interface JSONSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'integer';
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  required?: string[];
  enum?: string[];
  description?: string;
}

export interface RunJSONOptions<T> {
  provider: Provider;
  system: string;
  user: string;
  schema: JSONSchema;
  schemaName: string;
  schemaDescription?: string;
  maxOutputTokens?: number;
  validate?: (parsed: unknown) => parsed is T;
}

export class SkillError extends Error {
  constructor(
    public readonly skill: string,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'SkillError';
  }
}

function jsonSchemaToGemini(s: JSONSchema): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  switch (s.type) {
    case 'object':
      out.type = Type.OBJECT;
      if (s.properties) {
        out.properties = Object.fromEntries(
          Object.entries(s.properties).map(([k, v]) => [k, jsonSchemaToGemini(v)]),
        );
      }
      if (s.required) out.required = s.required;
      break;
    case 'array':
      out.type = Type.ARRAY;
      if (s.items) out.items = jsonSchemaToGemini(s.items);
      break;
    case 'string':
      out.type = Type.STRING;
      if (s.enum) out.enum = s.enum;
      break;
    case 'integer':
      out.type = Type.INTEGER;
      break;
    case 'number':
      out.type = Type.NUMBER;
      break;
    case 'boolean':
      out.type = Type.BOOLEAN;
      break;
  }
  if (s.description) out.description = s.description;
  return out;
}

async function runClaude<T>(opts: RunJSONOptions<T>): Promise<T> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new SkillError(opts.schemaName, 'ANTHROPIC_API_KEY is not set');
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const toolName = `emit_${opts.schemaName}`;
  const resp = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: opts.maxOutputTokens ?? 4096,
    system: opts.system,
    tools: [
      {
        name: toolName,
        description:
          opts.schemaDescription ?? `Emit a structured ${opts.schemaName} value.`,
        input_schema: opts.schema as unknown as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: 'tool', name: toolName },
    messages: [{ role: 'user', content: opts.user }],
  });

  const toolUse = resp.content.find((b) => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new SkillError(opts.schemaName, 'Claude returned no tool_use block');
  }
  const parsed = toolUse.input as unknown;
  if (opts.validate && !opts.validate(parsed)) {
    throw new SkillError(opts.schemaName, 'Claude output failed validation');
  }
  return parsed as T;
}

async function runGemini<T>(opts: RunJSONOptions<T>): Promise<T> {
  if (!process.env.GEMINI_API_KEY) {
    throw new SkillError(opts.schemaName, 'GEMINI_API_KEY is not set');
  }
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Gemini 2.5 models use internal thinking tokens that count against
  // maxOutputTokens. We pad generously so structured JSON is never truncated.
  const visibleBudget = opts.maxOutputTokens ?? 4096;
  const resp = await ai.models.generateContent({
    model: GEMINI_TEXT_MODEL,
    contents: [{ role: 'user', parts: [{ text: opts.user }] }],
    config: {
      systemInstruction: opts.system,
      responseMimeType: 'application/json',
      responseSchema: jsonSchemaToGemini(opts.schema) as never,
      maxOutputTokens: visibleBudget * 2 + 4096,
    },
  });

  const text =
    resp.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text ?? '';
  if (!text) {
    const blockReason = resp.promptFeedback?.blockReason;
    throw new SkillError(
      opts.schemaName,
      blockReason ? `blocked: ${blockReason}` : 'Gemini returned empty text',
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new SkillError(opts.schemaName, `Gemini JSON parse failed: ${text.slice(0, 200)}`, err);
  }
  if (opts.validate && !opts.validate(parsed)) {
    throw new SkillError(opts.schemaName, 'Gemini output failed validation');
  }
  return parsed as T;
}

export async function runJSON<T>(opts: RunJSONOptions<T>): Promise<T> {
  if (opts.provider === 'claude') return runClaude<T>(opts);
  return runGemini<T>(opts);
}

export const MODELS = {
  claude: CLAUDE_MODEL,
  gemini: GEMINI_TEXT_MODEL,
};
