import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import {
  TRANSLATABLE_FIELDS,
  TRANSLATION_MAX_BODY_BYTES,
  TRANSLATION_MAX_FIELD_CHARS,
  type TranslatableField,
} from "@/sanity/lib/translationFields";

const STUDIO_ORIGINS = new Set([
  "https://exotichk-admin.sanity.studio",
  "http://localhost:3333",
  "http://127.0.0.1:3333",
]);

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_PER_USER = 10;
const RATE_LIMIT_GLOBAL = 40;
const hits = new Map<string, number[]>();

type FieldMap = Partial<Record<TranslatableField, string>>;

export function OPTIONS(request: NextRequest): NextResponse {
  return cors(request, new NextResponse(null, { status: 204 }));
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const originError = rejectOrigin(request);
  if (originError) return originError;

  const lengthHeader = request.headers.get("content-length");
  if (lengthHeader && Number(lengthHeader) > TRANSLATION_MAX_BODY_BYTES) {
    return cors(request, json({ error: "Payload too large." }, 413));
  }

  const token = bearerToken(request.headers.get("authorization"));
  if (!token) {
    return cors(request, json({ error: "Unauthorized." }, 401));
  }

  const actor = await verifySanityEditor(token);
  if (!actor) {
    return cors(request, json({ error: "Unauthorized." }, 401));
  }

  if (!allow(actor.id) || !allow("global", RATE_LIMIT_GLOBAL)) {
    return cors(request, json({ error: "Too many translation requests. Try again later." }, 429));
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return cors(request, json({ error: "Translation is not configured." }, 503));
  }

  let payload: unknown;
  try {
    const raw = await request.text();
    if (raw.length > TRANSLATION_MAX_BODY_BYTES) {
      return cors(request, json({ error: "Payload too large." }, 413));
    }
    payload = JSON.parse(raw) as unknown;
  } catch {
    return cors(request, json({ error: "Invalid JSON." }, 400));
  }

  const fields = parseFields(payload);
  if (!fields) {
    return cors(request, json({ error: "Send only allowed English text fields." }, 400));
  }
  if (Object.keys(fields).length === 0) {
    return cors(request, json({ error: "Nothing to translate." }, 400));
  }

  try {
    const translated = await translateFields(apiKey, fields);
    return cors(request, json({ fields: translated }, 200));
  } catch {
    return cors(request, json({ error: "Translation failed." }, 502));
  }
}

export function GET(): NextResponse {
  return methodNotAllowed();
}

export function PUT(): NextResponse {
  return methodNotAllowed();
}

export function PATCH(): NextResponse {
  return methodNotAllowed();
}

export function DELETE(): NextResponse {
  return methodNotAllowed();
}

function methodNotAllowed(): NextResponse {
  return NextResponse.json(
    { error: "Method not allowed." },
    { status: 405, headers: { Allow: "POST, OPTIONS", "Cache-Control": "no-store" } },
  );
}

function json(body: Record<string, unknown>, status: number): NextResponse {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function cors(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get("origin");
  if (origin && STUDIO_ORIGINS.has(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
    response.headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
    response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.headers.set("Access-Control-Max-Age", "600");
  }
  return response;
}

function rejectOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");
  if (!origin) return cors(request, json({ error: "Origin required." }, 403));
  if (!STUDIO_ORIGINS.has(origin)) return cors(request, json({ error: "Origin not allowed." }, 403));
  return null;
}

function bearerToken(header: string | null): string | undefined {
  if (!header || !header.startsWith("Bearer ")) return undefined;
  const token = header.slice("Bearer ".length).trim();
  return token || undefined;
}

function allow(key: string, limit = RATE_LIMIT_PER_USER): boolean {
  const now = Date.now();
  const stamps = (hits.get(key) ?? []).filter((stamp) => now - stamp < RATE_LIMIT_WINDOW_MS);
  if (stamps.length >= limit) {
    hits.set(key, stamps);
    return false;
  }
  stamps.push(now);
  hits.set(key, stamps);
  return true;
}

async function verifySanityEditor(token: string): Promise<{ id: string } | null> {
  const me = await fetch(`https://${env.sanityProjectId}.api.sanity.io/v${env.sanityApiVersion}/users/me`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!me.ok) return null;
  const body = (await me.json()) as { id?: string; isRobot?: boolean };
  if (!body.id || body.isRobot) return null;

  const project = await fetch(`https://api.sanity.io/v${env.sanityApiVersion}/projects/${env.sanityProjectId}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (!project.ok) return null;
  return { id: body.id };
}

function parseFields(payload: unknown): FieldMap | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const incoming = (payload as { fields?: unknown }).fields;
  if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) return null;
  const record = incoming as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!TRANSLATABLE_FIELDS.includes(key as TranslatableField)) return null;
  }
  const fields: FieldMap = {};
  for (const key of TRANSLATABLE_FIELDS) {
    const value = record[key];
    if (value === undefined) continue;
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    if (!trimmed) continue;
    if (trimmed.length > TRANSLATION_MAX_FIELD_CHARS) return null;
    fields[key] = trimmed;
  }
  return fields;
}

async function translateFields(apiKey: string, fields: FieldMap): Promise<FieldMap> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You translate English marketing copy into Traditional Chinese as used in Hong Kong (zh-HK). Return a JSON object that contains only the same keys you were given. Do not add keys. Do not translate personal names that are already romanized; leave them in Latin script. Do not invent URLs, IDs, ages, or contact details.",
        },
        {
          role: "user",
          content: JSON.stringify(fields),
        },
      ],
    }),
  });
  if (!response.ok) {
    throw new Error("provider_error");
  }
  const body = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = body.choices?.[0]?.message?.content;
  if (!content) throw new Error("empty_provider");
  const parsed = JSON.parse(content) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("bad_json");
  const source = parsed as Record<string, unknown>;
  const out: FieldMap = {};
  for (const key of TRANSLATABLE_FIELDS) {
    if (!(key in fields)) continue;
    const value = source[key];
    if (typeof value !== "string" || !value.trim()) throw new Error("missing_field");
    out[key] = value.trim().slice(0, TRANSLATION_MAX_FIELD_CHARS);
  }
  return out;
}
