import { copy } from "@/lib/ui-extra";
import type { Metadata } from "next";
export const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export function metadata(
  title: string,
  description: string,
  path: string,
  indexable = true,
): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path, languages: { "de-CH": path } },
    robots: {
      index: Boolean(process.env.NEXT_PUBLIC_SITE_URL) && indexable,
      follow: indexable,
    },
    openGraph: {
      title,
      description,
      url: path,
      siteName: copy("sproutly_60e4dc"),
      locale: "de_CH",
      type: "website",
      images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
    },
  };
}
