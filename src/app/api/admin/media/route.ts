import { copy } from "@/lib/ui-extra";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import {
  failure,
  HttpError,
  sameOrigin,
  staff,
  rateLimit,
  boundedBytes,
  body,
} from "@/lib/security";
import { resources } from "@/lib/model";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    const { db } = await staff("media_assets");
    await rateLimit(req, "upload", 20, 3600);
    const upload = await boundedBytes(req, 51 * 1024 * 1024);
    const form = await new Response(new Uint8Array(upload), {
      headers: { "content-type": req.headers.get("content-type") || "" },
    }).formData();
    const file = form.get("file");
    const alt = String(form.get("alt") || "").trim();
    if (
      !(file instanceof File) ||
      !alt ||
      alt.length > 300 ||
      file.size > 50 * 1024 * 1024 ||
      file.size === 0
    )
      throw new HttpError(
        400,
        copy("datei_und_alternativtext_erforderlich_maximal_dd96ed"),
      );
    const bytes = Buffer.from(await file.arrayBuffer());
    const types: Record<string, { extension: string; valid: boolean }> = {
      "image/png": {
        extension: "png",
        valid: bytes
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
      },
      "image/jpeg": {
        extension: "jpg",
        valid: bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255,
      },
      "image/webp": {
        extension: "webp",
        valid:
          bytes.toString("ascii", 0, 4) === "RIFF" &&
          bytes.toString("ascii", 8, 12) === "WEBP",
      },
      "video/mp4": {
        extension: "mp4",
        valid: bytes.toString("ascii", 4, 8) === "ftyp",
      },
    };
    const type = types[file.type];
    if (!type?.valid)
      throw new HttpError(
        400,
        copy("nur_gultige_png_jpeg_webp_oder_mp4_dateien_er_bc2e99"),
      );
    if (file.type.startsWith("image/") && file.size > 10 * 1024 * 1024)
      throw new HttpError(
        400,
        copy("bilder_durfen_maximal_10_mb_gross_sein__9e7a29"),
      );
    let output = bytes;
    let mime = file.type;
    let extension = type.extension;
    if (file.type.startsWith("image/")) {
      try {
        output = await sharp(bytes, { limitInputPixels: 40000000 })
          .rotate()
          .resize({
            width: 2400,
            height: 2400,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 85 })
          .toBuffer();
        mime = "image/webp";
        extension = "webp";
      } catch {
        throw new HttpError(
          400,
          copy("bilddatei_kann_nicht_sicher_verarbeitet_werde_71fa62"),
        );
      }
    }
    const path = `${randomUUID()}.${extension}`;
    const { error } = await db.storage
      .from("site-media")
      .upload(path, output, { contentType: mime, upsert: false });
    if (error) throw error;
    const { error: recordError } = await db
      .from("media_assets")
      .insert({ path, mime, alt, size: output.length });
    if (recordError) {
      await db.storage.from("site-media").remove([path]);
      throw recordError;
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(req: Request) {
  try {
    sameOrigin(req);
    const { db } = await staff("media_assets");
    const { id } = await body(req);
    if (typeof id !== "string")
      throw new HttpError(400, copy("ungultige_datei__a8c1ac"));
    const { data: media } = await db
      .from("media_assets")
      .select("*")
      .eq("id", id)
      .single();
    if (!media) throw new HttpError(404, copy("nicht_gefunden__0e30e6"));
    for (const table of resources.filter(
      (r) => !["feedback_submissions", "media_assets"].includes(r),
    )) {
      const { data, error } = await db.from(table).select("*");
      if (error) throw error;
      if (JSON.stringify(data).includes(media.path))
        throw new HttpError(
          409,
          copy("die_datei_wird_noch_in_inhalten_verwendet__30098a"),
        );
    }
    const { error } = await db.storage.from("site-media").remove([media.path]);
    if (error) throw error;
    const { error: recordError } = await db
      .from("media_assets")
      .delete()
      .eq("id", id);
    if (recordError) throw recordError;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
