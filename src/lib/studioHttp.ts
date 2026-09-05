import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

export const STUDIO_ORIGINS = new Set([
  "https://exotichk-admin.sanity.studio",
  "http://localhost:3333",
  "http://127.0.0.1:3333",
]);

export function json(body: Record<string, unknown>, status: number): NextResponse {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export function applyStudioCors(request: NextRequest, response: NextResponse): NextResponse {
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

export function rejectStudioOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");
  if (!origin) return applyStudioCors(request, json({ error: "Origin required." }, 403));
  if (!STUDIO_ORIGINS.has(origin)) {
    return applyStudioCors(request, json({ error: "Origin not allowed." }, 403));
  }
  return null;
}

export function bearerToken(header: string | null): string | undefined {
  if (!header || !header.startsWith("Bearer ")) return undefined;
  const token = header.slice("Bearer ".length).trim();
  return token || undefined;
}

export async function verifySanityEditor(token: string): Promise<{ id: string } | null> {
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
