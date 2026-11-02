import { z } from "zod";
import { categories } from "./browser";
export { categories, preferredStore } from "./browser";
export const roadStatuses = [
  "In Prüfung",
  "Geplant",
  "In Entwicklung",
  "Testphase",
  "Veröffentlicht",
] as const;
export const moderationStatuses = [
  "Eingegangen",
  "In Prüfung",
  "Freigegeben",
  "Abgelehnt",
  "Erledigt",
  "Spam",
  "Archiviert",
] as const;
export const roleSchema = z.enum(["administrator", "editor", "moderator"]);
export type Role = z.infer<typeof roleSchema>;
export const resources = [
  "page_sections",
  "feature_cards",
  "faqs",
  "testimonials",
  "developer_news",
  "releases",
  "roadmap_items",
  "feedback_submissions",
  "site_settings",
  "media_assets",
] as const;
export type Resource = (typeof resources)[number];
export function canEdit(role: Role, resource: Resource) {
  return (
    role === "administrator" ||
    (role === "moderator"
      ? resource === "feedback_submissions"
      : !["site_settings", "feedback_submissions"].includes(resource))
  );
}
export function safeUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password;
  } catch {
    return false;
  }
}
export function localStorageUrl(value: string) {
  try {
    const configured = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "");
    const url = new URL(value);
    return configured.hostname === "127.0.0.1" && configured.protocol === "http:" &&
      url.origin === configured.origin && !url.username && !url.password &&
      url.pathname.startsWith("/storage/v1/object/public/site-media/");
  } catch { return false; }
}
export function storeUrl(value: string, store: "apple" | "google") {
  if (!safeUrl(value)) return false;
  const host = new URL(value).hostname;
  return store === "apple"
    ? host === "apps.apple.com"
    : host === "play.google.com";
}
export const feedbackSchema = z
  .object({
    title: z.string().trim().min(3).max(80),
    description: z.string().trim().min(10).max(500),
    category: z.enum(categories),
    email: z.union([z.email().max(254), z.literal("")]).optional(),
    website: z.string().max(0),
    startedAt: z.number().int(),
  })
  .strict();
export const blockSchema = z
  .object({
    type: z.enum(["paragraph", "heading", "list", "image", "link"]),
    text: z.string().max(10000).default(""),
    url: z.string().max(2048).optional(),
  })
  .strict()
  .refine(
    (v) => !v.url || safeUrl(v.url) || (v.type === "image" && localStorageUrl(v.url)) || /^\/(?!\/)[^\\]*$/.test(v.url),
    "Unsichere URL",
  );
export type Block = z.infer<typeof blockSchema>;
export const settingsSchema = z
  .object({
    heroTitle: z.string().min(1).max(150),
    heroSubtitle: z.string().max(500),
    apple: z.string().max(2048),
    google: z.string().max(2048),
    instagram: z.string().max(2048),
    facebook: z.string().max(2048),
    tiktok: z.string().max(2048),
    instagramPost: z.string().max(2048),
    analyticsEnabled: z.boolean(),
    company: z.string().max(300),
    address: z.string().max(500),
    contact: z.union([z.email(), z.literal("")]),
    legalVerified: z.boolean(),
    feedbackRetentionDays: z.number().int().min(7).max(3650),
    contactRetentionDays: z.number().int().min(1).max(365),
    logRetentionDays: z.number().int().min(7).max(365),
    seoTitle: z.string().max(100),
    seoDescription: z.string().max(300),
    indexable: z.boolean(),
  })
  .strict()
  .superRefine((v, ctx) => {
    for (const k of [
      "instagram",
      "facebook",
      "tiktok",
      "instagramPost",
    ] as const)
      if (v[k] && !safeUrl(v[k]))
        ctx.addIssue({
          code: "custom",
          path: [k],
          message: "HTTPS-URL erforderlich",
        });
    for (const [k, s] of [
      ["apple", "apple"],
      ["google", "google"],
    ] as const)
      if (v[k] && !storeUrl(v[k], s))
        ctx.addIssue({
          code: "custom",
          path: [k],
          message: "Offizielle Store-URL erforderlich",
        });
    if (
      v.instagramPost &&
      !/^https:\/\/www\.instagram\.com\/(p|reel)\/[\w-]+\/?$/.test(
        v.instagramPost,
      )
    )
      ctx.addIssue({
        code: "custom",
        path: ["instagramPost"],
        message: "Gültige Instagram-Beitrags-URL erforderlich",
      });
  });
export type Settings = z.infer<typeof settingsSchema>;
export type Entry = {
  id: string;
  title: string;
  description: string;
  status: string;
  slug: string | null;
  category: string;
  position: number;
  visible: boolean;
  locale: string;
  data: Record<string, unknown>;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};
export const entrySchema = z
  .object({
    title: z.string().trim().min(1).max(150),
    description: z.string().max(2000),
    status: z.enum(["draft", "published", "archived", ...roadStatuses]),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(120)
      .nullable(),
    category: z.string().max(80),
    position: z.number().int().min(0).max(10000),
    visible: z.boolean(),
    locale: z.enum(["de", "en"]),
    data: z
      .object({
        blocks: z.array(blockSchema).max(100).optional(),
        icon: z
          .enum(["sparkles", "check", "notes", "folder", "mic", "grid"])
          .optional(),
        media: z.string().max(2048).optional(),
        alt: z.string().max(300).optional(),
        platform: z.enum(["iOS", "Android", "Alle"]).optional(),
        version: z.string().max(40).optional(),
        changes: z
          .array(
            z.object({
              category: z.enum([
                "Added",
                "Improved",
                "Fixed",
                "Removed",
                "Security",
                "Known",
              ]),
              text: z.string().max(2000),
            }),
          )
          .max(100)
          .optional(),
        period: z.string().max(100).optional(),
        source: z.string().max(1000).optional(),
        approved: z.boolean().optional(),
        section: z
          .enum([
            "hero",
            "features",
            "how",
            "demo",
            "videos",
            "testimonials",
            "news",
            "social",
            "faq",
            "download",
          ])
          .optional(),
        background: z.enum(["cream", "lilac", "mint"]).optional(),
        seoTitle: z.string().max(100).optional(),
        seoDescription: z.string().max(300).optional(),
        indexable: z.boolean().optional(),
        socialImage: z.string().max(2048).optional(),
      })
      .strict(),
    published_at: z.iso.datetime().nullable(),
  })
  .strict()
  .superRefine((v, ctx) => {
    for (const k of ["media", "socialImage"] as const) {
      const url = v.data[k];
      if (url && !/^\/(?!\/)[^\\]*$/.test(url) && !safeUrl(url) && !localStorageUrl(url))
        ctx.addIssue({
          code: "custom",
          path: ["data", k],
          message: "Ungültige Medien-URL",
        });
    }
  });
