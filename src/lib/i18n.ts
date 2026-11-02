import de from "@/messages/de.json";
export const defaultLocale = "de";
export const preparedLocales = ["de", "en"] as const;
// English is intentionally not advertised until content and legal translations are approved.
export function messages(locale: string = "de") {
  return { text: de, resolvedLocale: "de", fallback: locale !== "de" };
}
export const t = de;
