import type { MetadataRoute } from "next";
import { settings } from "@/lib/db";
import { siteUrl } from "@/lib/seo";
export default async function robots(): Promise<MetadataRoute.Robots> {
  const s = await settings();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow:
        !process.env.NEXT_PUBLIC_SITE_URL || !s.indexable
          ? "/"
          : ["/admin", "/api"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
