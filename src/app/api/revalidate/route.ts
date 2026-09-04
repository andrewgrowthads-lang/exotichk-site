import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

/**
 * The only API endpoint in this project. Sanity calls it on every
 * publish. It does not accept a path or tag from the caller — it always
 * revalidates the single `catalog` tag, so there is nothing here for a
 * malicious or malformed payload to target.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!env.revalidateSecret) {
    return json({ error: "Revalidation is not configured." }, 500);
  }

  const providedSecret = request.headers.get("x-sanity-webhook-secret");
  if (!providedSecret || !secretsEqual(providedSecret, env.revalidateSecret)) {
    return json({ error: "Unauthorized." }, 401);
  }

  // Next.js 16 requires a cacheLife profile. `"max"` is the documented
  // catalog pattern: the next visitor is served stale HTML while the
  // tagged pages regenerate in the background.
  revalidateTag("catalog", "max");
  return json({ revalidated: true }, 200);
}

function secretsEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function json(body: Record<string, unknown>, status: number): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
