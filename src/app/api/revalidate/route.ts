import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import {
  applyStudioCors,
  bearerToken,
  json,
  rejectStudioOrigin,
  verifySanityEditor,
} from "@/lib/studioHttp";

/**
 * Sanity webhook (secret header) or hosted Studio (editor session) can
 * expire the catalog tag. The caller never chooses a path or tag.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!env.revalidateSecret) {
    return json({ error: "Revalidation is not configured." }, 500);
  }

  const webhookSecret = request.headers.get("x-sanity-webhook-secret");
  if (webhookSecret) {
    if (!secretsEqual(webhookSecret, env.revalidateSecret)) {
      return json({ error: "Unauthorized." }, 401);
    }
    expireCatalog();
    return json({ revalidated: true }, 200);
  }

  const originError = rejectStudioOrigin(request);
  if (originError) return originError;

  const token = bearerToken(request.headers.get("authorization"));
  if (!token || !(await verifySanityEditor(token))) {
    return applyStudioCors(request, json({ error: "Unauthorized." }, 401));
  }

  expireCatalog();
  return applyStudioCors(request, json({ revalidated: true }, 200));
}

export function OPTIONS(request: NextRequest): NextResponse {
  return applyStudioCors(request, new NextResponse(null, { status: 204 }));
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

function expireCatalog(): void {
  revalidateTag("catalog", { expire: 0 });
  revalidatePath("/", "layout");
}

function secretsEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function methodNotAllowed(): NextResponse {
  return NextResponse.json(
    { error: "Method not allowed." },
    { status: 405, headers: { Allow: "POST, OPTIONS", "Cache-Control": "no-store" } },
  );
}
