import { copy } from "@/lib/ui-extra";
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { serviceDb } from "@/lib/db";
import { failure, HttpError } from "@/lib/security";
export async function POST(req: Request) {
  try {
    const secret = process.env.CRON_SECRET;
    const supplied = req.headers.get("authorization") || "";
    if (
      !secret ||
      secret.length < 32 ||
      supplied.length !== secret.length + 7 ||
      !timingSafeEqual(Buffer.from(supplied), Buffer.from(`Bearer ${secret}`))
    )
      throw new HttpError(401, copy("nicht_autorisiert__9c9b03"));
    const { error } = await serviceDb().rpc("cleanup_retention");
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
