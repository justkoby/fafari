/* ------------------------------------------------------------------
   Fafari Assistant — server core.

   Framework-agnostic on purpose: the exact same function backs the
   Vercel serverless route (api/assistant.ts) and the local Vite dev
   middleware (vite.config.ts), so behaviour never drifts between dev
   and production.

   Security — GROQ_API_KEY is passed in by the caller from the server
   environment only. It is used solely in the Authorization header of
   the request to Groq and is never returned to the client, logged, or
   bundled into the browser. The client never talks to Groq directly.

   Truth — the catalogue in src/data/products.ts is the single source of
   truth. Groq only ever returns product *ids*; every id is re-validated
   against the catalogue here (and again on the client) before anything
   is rendered, so the model cannot invent products, prices or links.
------------------------------------------------------------------- */

import { PRODUCTS } from '../src/data/products';

/** Shape the browser sends. Everything here is untrusted and re-validated. */
export interface AssistantRequestBody {
  message?: unknown;
  history?: unknown;
  context?: unknown;
}

/** Normalised reply handed back to the client. */
export interface AssistantResponseBody {
  reply: string;
  productIds: string[];
  needsFollowUp: boolean;
  customOrder: boolean;
  /** True when Groq was unreachable/invalid and we fell back gracefully. */
  degraded?: boolean;
}

export interface AssistantResult {
  status: number;
  body: AssistantResponseBody | { error: string };
}

export interface AssistantOptions {
  /** Server-only Groq key. Never sent back to the browser. */
  apiKey: string;
  /** Optional model override (defaults to a fast, cheap Llama). */
  model?: string;
  /** Injectable transport so tests never touch the network. */
  fetchImpl?: typeof fetch;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.1-8b-instant';
const MAX_MESSAGE_CHARS = 600;
const MAX_CONTEXT_CHARS = 240;
const MAX_HISTORY_TURNS = 6;
const MAX_REPLY_CHARS = 500;
const MAX_PRODUCTS = 3;
const GROQ_TIMEOUT_MS = 12000;

const NETWORK_FALLBACK =
  "I'm having trouble reaching the studio assistant right now. Please try again in a moment, or message us on WhatsApp and a real person will help you personally.";
const NO_MATCH_REPLY =
  "I couldn't find the perfect match in our studio, but we would love to create something bespoke for you.";
const DEFAULT_REPLY = 'Here are a few pieces from the studio that may suit your moment.';

/**
 * Handle one assistant turn: validate the request, ask Groq to extract
 * intent, validate the ids it returns against the real catalogue, and
 * always resolve to a render-safe body (never a crash).
 */
export async function handleAssistant(
  rawBody: unknown,
  options: AssistantOptions,
): Promise<AssistantResult> {
  const body = (rawBody && typeof rawBody === 'object' ? rawBody : {}) as AssistantRequestBody;

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return { status: 400, body: { error: 'A message is required.' } };
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return { status: 400, body: { error: `Please keep messages under ${MAX_MESSAGE_CHARS} characters.` } };
  }

  /* No key configured (missing env var): degrade to a helpful fallback
     rather than throwing, so the UI can still point to WhatsApp. */
  if (!options.apiKey) {
    return degraded(
      "The assistant isn't configured on the server yet. Please browse the shop, or message us on WhatsApp and we'll help you personally.",
    );
  }

  const doFetch = options.fetchImpl ?? fetch;
  const model = options.model || DEFAULT_MODEL;
  const context = typeof body.context === 'string' ? body.context.trim().slice(0, MAX_CONTEXT_CHARS) : '';
  const history = sanitizeHistory(body.history);

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt() },
    ...(context
      ? [{ role: 'system' as const, content: `Site context the visitor already chose — ${context}` }]
      : []),
    ...history,
    { role: 'user', content: message },
  ];

  let payload: unknown;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);
    const response = await doFetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${options.apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_completion_tokens: 400,
        response_format: { type: 'json_object' },
        messages,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!response.ok) return degraded(fallbackForStatus(response.status));
    payload = await response.json();
  } catch {
    return degraded(NETWORK_FALLBACK);
  }

  const content = (payload as { choices?: { message?: { content?: unknown } }[] })?.choices?.[0]?.message
    ?.content;
  const parsed = parseModelJson(content);
  if (!parsed) return degraded(NETWORK_FALLBACK);

  const wantsFollowUp = parsed.needsFollowUp === true;
  /* A clarifying question should not also push products at the visitor. */
  const productIds = wantsFollowUp ? [] : validateIds(parsed.productIds);
  const customOrder = productIds.length === 0 && !wantsFollowUp;
  const reply = clampReply(parsed.reply);

  return {
    status: 200,
    body: {
      reply: reply || (customOrder ? NO_MATCH_REPLY : DEFAULT_REPLY),
      productIds,
      needsFollowUp: wantsFollowUp,
      customOrder,
    },
  };
}

/** Graceful, render-safe fallback with the WhatsApp escape hatch. */
function degraded(reply: string): AssistantResult {
  return {
    status: 200,
    body: { reply, productIds: [], needsFollowUp: false, customOrder: true, degraded: true },
  };
}

function fallbackForStatus(status: number): string {
  if (status === 429) {
    return "We're a little busy at the moment. Please try again in a few seconds, or message us on WhatsApp and we'll help you personally.";
  }
  if (status === 401 || status === 403) {
    return "The assistant isn't authorised on the server yet. Please browse the shop, or message us on WhatsApp and we'll help you personally.";
  }
  return NETWORK_FALLBACK;
}

/** Keep only well-formed recent turns; cap length to bound the payload. */
function sanitizeHistory(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return [];
  const out: ChatMessage[] = [];
  for (const turn of input.slice(-MAX_HISTORY_TURNS)) {
    if (!turn || typeof turn !== 'object') continue;
    const { role, content } = turn as { role?: unknown; content?: unknown };
    if ((role === 'user' || role === 'assistant') && typeof content === 'string') {
      out.push({ role, content: content.slice(0, MAX_MESSAGE_CHARS) });
    }
  }
  return out;
}

/** System prompt with the full (tiny) catalogue embedded as the truth. */
function systemPrompt(): string {
  const catalogue = PRODUCTS.map((product) => {
    const cues = Array.from(new Set([...product.searchTerms, ...product.keywords, ...product.tags])).join(', ');
    const occasions = product.occasions.length ? product.occasions.join('/') : 'any';
    return `- id="${product.id}"; name="${product.name}"; category=${product.category}; price=GH₵${product.price}; occasions=${occasions}; cues=${cues}`;
  }).join('\n');

  return [
    'You are the Fafari Assistant, a warm and concise shopping helper for Fafari, a florist and gifting studio in Accra, Ghana. All prices are in Ghana cedis (GH₵).',
    '',
    'You recommend gifts ONLY from the fixed catalogue below, and you may only use an id that appears here. Never invent products, ids, prices, stock, delivery coverage, discounts or policies. Never claim you can place orders, take payment, check out or track deliveries.',
    '',
    'CATALOGUE:',
    catalogue,
    '',
    'How to respond:',
    '- If an essential detail is missing (the occasion, who it is for, or a budget when it clearly matters), ask ONE short friendly follow-up question, set needsFollowUp true, and recommend nothing yet.',
    '- Otherwise choose up to 3 catalogue items that genuinely fit the request and any stated budget, best match first.',
    '- If nothing in the catalogue suits the request, recommend nothing and set customOrder true so we can offer a bespoke arrangement.',
    '- reply: 1 to 3 short sentences, natural and helpful, plain text only (no markdown, no bullet lists, no emojis). Do not list prices unless the visitor asked about a budget.',
    '',
    'Respond with STRICT JSON only, in exactly this shape and with no extra keys:',
    '{"reply": string, "productIds": string[], "needsFollowUp": boolean, "customOrder": boolean}',
    'productIds must contain 0 to 3 ids copied verbatim from the catalogue.',
  ].join('\n');
}

/** Tolerant JSON extraction — models sometimes wrap or pad the object. */
function parseModelJson(content: unknown): Record<string, unknown> | null {
  if (typeof content !== 'string' || !content.trim()) return null;
  const tryParse = (text: string): unknown => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };
  let parsed = tryParse(content);
  if (!parsed || typeof parsed !== 'object') {
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    parsed = start !== -1 && end > start ? tryParse(content.slice(start, end + 1)) : null;
  }
  return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
}

/** Drop unknown/duplicate ids, cap at three, preserve the model's order. */
function validateIds(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const known = new Set(PRODUCTS.map((product) => product.id));
  const out: string[] = [];
  for (const item of input) {
    if (typeof item === 'string' && known.has(item) && !out.includes(item)) out.push(item);
    if (out.length >= MAX_PRODUCTS) break;
  }
  return out;
}

function clampReply(input: unknown): string {
  return typeof input === 'string' ? input.trim().slice(0, MAX_REPLY_CHARS) : '';
}
