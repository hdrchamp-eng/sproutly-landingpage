import { copy } from "@/lib/ui-extra";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  entrySchema,
  settingsSchema,
  resources,
  moderationStatuses,
  categories,
  type Resource,
} from "@/lib/model";
import {
  body,
  failure,
  HttpError,
  sameOrigin,
  staff,
  rateLimit,
} from "@/lib/security";
import { revalidatePath } from "next/cache";
export async function POST(
  req: Request,
  { params }: { params: Promise<{ resource: string }> },
) {
  try {
    sameOrigin(req);
    const { resource: r } = await params;
    if (!resources.includes(r as Resource))
      throw new HttpError(404, copy("nicht_gefunden__0e30e6"));
    const resource = r as Resource;
    const { db, user } = await staff(resource);
    await rateLimit(req, "admin-write", 180, 60);
    const raw = await body(req);
    const envelope = z
      .object({
        operation: z.enum(["save", "delete", "reply"]),
        id: z.string().max(100).optional(),
        value: z.unknown().optional(),
      })
      .strict()
      .parse(raw);
    if (envelope.operation === "delete") {
      const id = z.uuid().parse(envelope.id);
      if (["site_settings", "media_assets"].includes(resource))
        throw new HttpError(
          400,
          copy("diese_aktion_ist_hier_nicht_moglich__b6b99e"),
        );
      const { error } = await db.from(resource).delete().eq("id", id);
      if (error) throw error;
    } else if (resource === "site_settings") {
      const value = settingsSchema.parse(envelope.value);
      const { error } = await db.from(resource).upsert({ id: "site", value });
      if (error) throw error;
    } else if (resource === "feedback_submissions") {
      const id = z.uuid().parse(envelope.id);
      if (envelope.operation === "reply") {
        const { response } = z
          .object({ response: z.string().trim().min(1).max(2000) })
          .parse(envelope.value);
        const { data: feedback } = await db
          .from(resource)
          .select("status")
          .eq("id", id)
          .single();
        if (feedback?.status !== copy("freigegeben_ed0404"))
          throw new HttpError(
            400,
            copy("zuerst_den_beitrag_freigeben__78c3e8"),
          );
        const { error } = await db
          .from("feedback_responses")
          .insert({ feedback_id: id, administrator_id: user.id, response });
        if (error) throw error;
      } else {
        const value = z
          .object({
            status: z.enum(moderationStatuses),
            category: z.enum(categories),
            internal_note: z.string().max(2000),
          })
          .strict()
          .parse(envelope.value);
        const { error } = await db.from(resource).update(value).eq("id", id);
        if (error) throw error;
      }
    } else if (resource === "media_assets") {
      const id = z.uuid().parse(envelope.id);
      const value = z
        .object({ alt: z.string().min(1).max(300) })
        .strict()
        .parse(envelope.value);
      const { error } = await db.from(resource).update(value).eq("id", id);
      if (error) throw error;
    } else {
      const value = entrySchema.parse(envelope.value);
      const imageAllowed = (url: string) =>
        /^\/(images|brand|videos)\/[^\\]*$/.test(url) ||
        Boolean(
          process.env.NEXT_PUBLIC_SUPABASE_URL &&
          url.startsWith(
            process.env.NEXT_PUBLIC_SUPABASE_URL +
              "/storage/v1/object/public/site-media/",
          ),
        );
      const videoAllowed = (url: string) =>
        /^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(url);
      for (const url of [value.data.media, value.data.socialImage])
        if (
          url &&
          !imageAllowed(url) &&
          !(
            resource === "page_sections" &&
            value.data.section === "videos" &&
            videoAllowed(url)
          )
        )
          throw new HttpError(
            400,
            copy("bitte_eine_lokale_datei_oder_eine_url_aus_der_bbc20f"),
          );
      for (const block of value.data.blocks || [])
        if (block.type === "image" && block.url && !imageAllowed(block.url))
          throw new HttpError(
            400,
            copy("bilder_mussen_aus_der_eigenen_medienbibliothe_f77617"),
          );
      if (resource === "page_sections" && !value.data.section)
        throw new HttpError(
          400,
          copy("bitte_einen_abschnittstyp_auswahlen__6a0b1d"),
        );

      if (
        resource === "testimonials" &&
        value.status === "published" &&
        (!value.data.approved || !value.data.source)
      )
        throw new HttpError(
          400,
          copy("freigabe_und_herkunft_der_kundenstimme_fehlen_5a4ed0"),
        );
      if (resource === "developer_news" && !value.slug)
        throw new HttpError(400, copy("ein_url_slug_ist_erforderlich__b40116"));
      if (
        resource === "releases" &&
        (!value.data.version || !value.data.platform)
      )
        throw new HttpError(
          400,
          copy("version_und_plattform_sind_erforderlich__ab8b2a"),
        );
      if (value.status === "published" && !value.published_at)
        value.published_at = new Date().toISOString();
      const query = envelope.id
        ? db.from(resource).update(value).eq("id", z.uuid().parse(envelope.id))
        : db.from(resource).insert(value);
      const { error } = await query;
      if (error?.code === "23505")
        throw new HttpError(
          409,
          copy("dieser_slug_wird_bereits_verwendet__3530c9"),
        );
      if (error) throw error;
    }
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError)
      return NextResponse.json(
        {
          error: copy("bitte_prufe_die_pflichtfelder_und_erlaubten_w_685263"),
          details: e.issues.map((i) => ({ path: i.path, message: i.message })),
        },
        { status: 400 },
      );
    return failure(e);
  }
}
