import { copy } from "@/lib/ui-extra";
import { NextResponse } from "next/server";
import { feedbackSchema } from "@/lib/model";
import {
  body,
  failure,
  HttpError,
  rateLimit,
  sameOrigin,
} from "@/lib/security";
import { serviceDb } from "@/lib/db";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const parsed = feedbackSchema.safeParse(await body(req));
    if (!parsed.success)
      throw new HttpError(
        400,
        copy("bitte_prufe_die_eingaben_und_zeichenlimits__38f80a"),
      );
    if (
      Date.now() - parsed.data.startedAt < 2000 ||
      Date.now() - parsed.data.startedAt > 86400000
    )
      throw new HttpError(
        400,
        copy("bitte_offne_das_formular_erneut_und_nimm_dir__6995a8"),
      );
    await rateLimit(req, "feedback", 5);
    const v = parsed.data;
    const { error } = await serviceDb().rpc("submit_feedback", {
      p_title: v.title,
      p_description: v.description,
      p_category: v.category,
      p_email: v.email || null,
    });
    if (error) throw error;
    return NextResponse.json(
      { message: copy("dein_beitrag_wird_vor_der_veroffentlichung_ge_6fd28c") },
      { status: 201 },
    );
  } catch (e) {
    return failure(e);
  }
}
