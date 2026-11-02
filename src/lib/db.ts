import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import {
  defaults,
  defaultFaqs,
  defaultFeatures,
  defaultSections,
} from "./defaults";
import { settingsSchema, type Entry, type Resource } from "./model";
export const configured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
export async function sessionDb() {
  if (!configured()) return null;
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) =>
              jar.set(name, value, {
                ...options,
                sameSite: "lax",
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
              }),
            );
          } catch {
            /* Cookie refresh is persisted by proxy. */
          }
        },
      },
    },
  );
}
export function publicDb() {
  return configured()
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } },
      )
    : null;
}
export function serviceDb() {
  if (!configured() || !process.env.SUPABASE_SERVICE_ROLE_KEY)
    throw new Error("NOT_CONFIGURED");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
export async function settings() {
  const db = publicDb();
  if (!db) return defaults;
  try {
    const { data, error } = await db
      .from("site_settings")
      .select("value")
      .eq("id", "site")
      .maybeSingle();
    if (error) throw error;
    const parsed = settingsSchema.safeParse({ ...defaults, ...data?.value });
    return parsed.success ? parsed.data : defaults;
  } catch {
    console.error(JSON.stringify({ event: "settings_unavailable" }));
    return defaults;
  }
}
export async function entries(resource: Resource): Promise<Entry[]> {
  const fallback =
    resource === "feature_cards"
      ? defaultFeatures
      : resource === "faqs"
        ? defaultFaqs
        : resource === "page_sections"
          ? defaultSections
          : [];
  const db = publicDb();
  if (!db) return fallback;
  try {
    const { data, error } = await db
      .from(resource)
      .select("*")
      .eq("locale", "de")
      .order("position")
      .order("published_at", { ascending: false });
    if (error) throw error;
    return data as Entry[];
  } catch {
    console.error(JSON.stringify({ event: "content_unavailable", resource }));
    return fallback;
  }
}
export type PublicFeedback = {
  id: string;
  title: string;
  description: string;
  category: string;
  created_at: string;
  votes: number;
  responses: { response: string; published_at: string }[];
};
export async function feedback(): Promise<PublicFeedback[]> {
  const db = publicDb();
  if (!db) return [];
  const { data, error } = await db.rpc("public_feedback");
  return error ? [] : data;
}
