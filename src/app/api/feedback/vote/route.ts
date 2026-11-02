import { copy } from "@/lib/ui-extra";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  body,
  digest,
  failure,
  HttpError,
  rateLimit,
  sameOrigin,
} from "@/lib/security";
import { serviceDb } from "@/lib/db";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const p = z
      .object({ id: z.uuid() })
      .strict()
      .safeParse(await body(req));
    if (!p.success)
      throw new HttpError(400, copy("ungultiger_vorschlag__85b22d"));
    await rateLimit(req, "vote", 30);
    const jar = await cookies();
    let voter = jar.get("sproutly-voter")?.value;
    if (!voter || !z.uuid().safeParse(voter).success) voter = randomUUID();
    const { data, error } = await serviceDb().rpc("vote_feedback", {
      p_id: p.data.id,
      p_hash: digest(voter),
    });
    if (error) throw error;
    const response = NextResponse.json({
      added: data,
      message: data
        ? copy("danke_fur_deine_stimme__82c89e")
        : copy("bereits_unterstutzt_oder_nicht_verfugbar__937c5a"),
    });
    response.cookies.set("sproutly-voter", voter, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 31536000,
      path: "/",
    });
    return response;
  } catch (e) {
    return failure(e);
  }
}
