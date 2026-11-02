import { copy } from "@/lib/ui-extra";
import "server-only";
import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { serviceDb, sessionDb } from "./db";
import { canEdit, roleSchema, type Resource } from "./model";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const url = new URL(req.url);
  const expected =
    process.env.NEXT_PUBLIC_SITE_URL ||
    `${url.protocol}//${req.headers.get("host") || url.host}`;
  try {
    if (!origin || new URL(origin).origin !== new URL(expected).origin)
      throw new Error("origin");
  } catch {
    throw new HttpError(403, copy("anfrage_nicht_erlaubt__a89905"));
  }
}
export async function boundedBytes(req: Request, limit: number) {
  const reader = req.body?.getReader();
  if (!reader) throw new HttpError(400, copy("anfrage_fehlt__8feecd"));
  const chunks: Uint8Array[] = [];
  let length = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > limit) {
      await reader.cancel();
      throw new HttpError(413, copy("anfrage_zu_gross__f80e12"));
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
export async function body(req: Request) {
  if (!req.headers.get("content-type")?.startsWith("application/json"))
    throw new HttpError(415, "JSON erforderlich.");
  const bytes = await boundedBytes(req, 128000);
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new HttpError(400, copy("ungultige_anfrage__aab1a6"));
  }
}
export function digest(value: string) {
  const secret = process.env.RATE_LIMIT_SECRET;
  if (!secret || secret.length < 32)
    throw new HttpError(503, copy("sicherheitskonfiguration_fehlt__1d00d6"));
  return createHmac("sha256", secret).update(value).digest("hex");
}
export async function rateLimit(
  req: Request,
  scope: string,
  limit = 10,
  seconds = 3600,
) {
  const ip =
    process.env.TRUST_PROXY === "true"
      ? req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"
      : "local";
  const day = new Date().toISOString().slice(0, 10);
  const { data, error } = await serviceDb().rpc("consume_limit", {
    p_key: digest(`${scope}:${day}:${ip}`),
    p_limit: limit,
    p_seconds: seconds,
  });
  if (error)
    throw new HttpError(
      503,
      copy("der_dienst_ist_vorubergehend_nicht_verfugbar__5fc612"),
    );
  if (!data)
    throw new HttpError(
      429,
      copy("zu_viele_anfragen_bitte_versuche_es_spater_er_0f1e81"),
    );
}
export async function staff(resource?: Resource) {
  const db = await sessionDb();
  if (!db)
    throw new HttpError(
      503,
      copy("administration_noch_nicht_eingerichtet__b7373c"),
    );
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) throw new HttpError(401, copy("bitte_anmelden__4c7a83"));
  const { data: assurance } =
    await db.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== "aal2")
    throw new HttpError(
      403,
      copy("zwei_faktor_anmeldung_erforderlich__cf4211"),
    );
  const { data } = await db
    .from("admin_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  const role = roleSchema.safeParse(data?.role);
  if (!role.success || (resource && !canEdit(role.data, resource)))
    throw new HttpError(403, copy("keine_berechtigung__84a68a"));
  return { db, user, role: role.data };
}
export function failure(error: unknown) {
  if (error instanceof HttpError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  console.error(
    JSON.stringify({
      event: "request_failed",
      type: error instanceof Error ? error.name : "Unknown",
    }),
  );
  return NextResponse.json(
    { error: copy("die_anfrage_konnte_nicht_verarbeitet_werden__48a343") },
    { status: 503 },
  );
}
