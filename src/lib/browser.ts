export const categories = [
  "Neue Funktion",
  "Verbesserung",
  "Fehlermeldung",
  "Allgemeine Frage",
  "Sonstiges Feedback",
] as const;
export function preferredStore(agent: string) {
  return /android/i.test(agent)
    ? "google"
    : /iphone|ipad|ipod/i.test(agent)
      ? "apple"
      : null;
}
