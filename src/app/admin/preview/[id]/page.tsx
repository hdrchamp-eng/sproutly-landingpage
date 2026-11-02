import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { Blocks } from "@/components/content";
import { staff, HttpError } from "@/lib/security";
import type { Entry } from "@/lib/model";
import { ui } from "@/lib/ui-text";

export const dynamic = "force-dynamic";
export const metadata = {
  title: ui("news_preview_label"),
  robots: { index: false, follow: false },
};

export default async function NewsPreview({ params }: { params: Promise<{ id: string }> }) {
  let session;
  try {
    session = await staff("developer_news");
  } catch (error) {
    if (error instanceof HttpError && [401, 403, 503].includes(error.status)) redirect("/admin");
    throw error;
  }
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { data, error } = await session.db.from("developer_news").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) notFound();
  const entry = data as Entry;
  return (
    <div className="container">
      <aside className="card" aria-label={ui("news_preview_label")}>
        <strong>{ui("news_preview_label")}</strong>
        <p>{ui("news_preview_notice")}</p>
        <Link href="/admin/news">{ui("news_preview_back")}</Link>
      </aside>
      <div className="page-heading">
        <span className="eyebrow">{entry.category}</span>
        <h1>{entry.title}</h1>
        <p>{entry.description}</p>
        {entry.published_at && <small>{new Intl.DateTimeFormat("de-CH", { dateStyle: "long" }).format(new Date(entry.published_at))}</small>}
      </div>
      <article className="prose"><Blocks blocks={entry.data.blocks} /></article>
    </div>
  );
}
