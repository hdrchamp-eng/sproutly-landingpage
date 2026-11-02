import { copy } from "@/lib/ui-extra";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  body,
  failure,
  HttpError,
  sameOrigin,
  rateLimit,
} from "@/lib/security";
import { sessionDb } from "@/lib/db";
export async function POST(
  req: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  try {
    sameOrigin(req);
    const { action } = await params;
    const db = await sessionDb();
    if (!db)
      throw new HttpError(
        503,
        copy("anmeldung_noch_nicht_eingerichtet__87edf0"),
      );
    await rateLimit(req, "auth", 12, 900);
    const raw = await body(req);
    if (action === "login") {
      const v = z
        .object({ email: z.email(), password: z.string().min(1).max(200) })
        .strict()
        .parse(raw);
      const { error } = await db.auth.signInWithPassword(v);
      if (error)
        throw new HttpError(
          401,
          copy("anmeldung_nicht_moglich_bitte_prufe_deine_ang_b9bd34"),
        );
      return NextResponse.json({ ok: true });
    }
    if (action === "logout") {
      await db.auth.signOut();
      return NextResponse.json({ ok: true });
    }
    const {
      data: { user },
    } = await db.auth.getUser();
    if (!user) throw new HttpError(401, copy("bitte_anmelden__4c7a83"));
    const { data: role } = await db
      .from("admin_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    if (!role) throw new HttpError(403, copy("kein_verwaltungszugang__1ca118"));
    if (action === "enroll") {
      const { data: factors } = await db.auth.mfa.listFactors();
      if (factors?.totp.some((f) => f.status === "verified"))
        throw new HttpError(409, copy("bereits_eingerichtet__a5f0ad"));
      for (const factor of factors?.all || [])
        if (factor.status === "unverified")
          await db.auth.mfa.unenroll({ factorId: factor.id });
      const { data, error } = await db.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Sproutly Website",
      });
      if (error) throw error;
      return NextResponse.json({
        factorId: data.id,
        qr: data.totp.qr_code,
        secret: data.totp.secret,
      });
    }
    if (action === "verify") {
      const v = z
        .object({ factorId: z.uuid(), code: z.string().regex(/^\d{6}$/) })
        .parse(raw);
      const { error } = await db.auth.mfa.challengeAndVerify(v);
      if (error)
        throw new HttpError(
          401,
          copy("der_code_ist_ungultig_oder_abgelaufen__a8512e"),
        );
      return NextResponse.json({ ok: true });
    }
    throw new HttpError(404, copy("nicht_gefunden__0e30e6"));
  } catch (e) {
    if (e instanceof z.ZodError)
      return NextResponse.json(
        { error: copy("bitte_prufe_deine_eingaben__b59137") },
        { status: 400 },
      );
    return failure(e);
  }
}
