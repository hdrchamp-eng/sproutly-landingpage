import type { MetadataRoute } from "next";
import { entries, settings } from "@/lib/db";
import { siteUrl } from "@/lib/seo";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const s = await settings();
  if (!process.env.NEXT_PUBLIC_SITE_URL || !s.indexable) return [];
  return [
    ...[
      "",
      "/downloads",
      "/developers",
      "/developers/news",
      "/developers/feedback",
    ].map((path) => ({
      url: siteUrl() + path,
      alternates: { languages: { "de-CH": siteUrl() + path } },
    })),
    ...(await entries("developer_news"))
      .filter((n) => n.data.indexable !== false)
      .map((n) => ({
        url: `${siteUrl()}/developers/news/${n.slug}`,
        lastModified: n.updated_at,
      })),
  ];
}
