import { copy } from "@/lib/ui-extra";
import { NextResponse } from "next/server";
import { z } from "zod";
import { settings, serviceDb } from "@/lib/db";
import {
  body,
  failure,
  HttpError,
  rateLimit,
  sameOrigin,
} from "@/lib/security";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const p = z
      .object({
        consent: z.literal(true),
        event: z.enum([
          "pageview",
          "apple",
          "google",
          "qr",
          "video",
          "social",
          "feedback",
          "faq",
        ]),
        path: z.enum([
          "/",
          "/downloads",
          "/developers",
          "/developers/news",
          "/developers/changelog",
          "/developers/patch-notes",
          "/developers/roadmap",
          "/developers/feedback",
          "/datenschutz",
          "/impressum",
        ]),
      })
      .strict()
      .safeParse(await body(req));
    if (!p.success)
      throw new HttpError(400, copy("ungultiges_ereignis__3193a3"));
    if (!(await settings()).analyticsEnabled)
      return new NextResponse(null, { status: 204 });
    await rateLimit(req, "analytics", 120, 60);
    const { error } = await serviceDb().rpc("record_event", {
      p_event: p.data.event,
      p_path: p.data.path,
    });
    if (error) throw error;
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return failure(e);
  }
}
