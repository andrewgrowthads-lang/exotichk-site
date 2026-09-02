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
    return NextResponse.json({ error: "Revalidation is not configured." }, { status: 500 });
  }

  const providedSecret = request.headers.get("x-sanity-webhook-secret");
  if (!providedSecret || !timingSafeEqual(providedSecret, env.revalidateSecret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Next.js 16 requires a cacheLife profile. `"max"` is the documented
  // catalog pattern: the next visitor is served stale HTML while the
  // tagged pages regenerate in the background.
  revalidateTag("catalog", "max");
  return NextResponse.json({ revalidated: true });
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
