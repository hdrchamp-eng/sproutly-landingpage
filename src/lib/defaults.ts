import type { Entry, Settings } from "./model";
export const defaults: Settings = {
  heroTitle: "Damit mehr Zeit für dich bleibt.",
  heroSubtitle:
    "Gedanken festhalten. Aufgaben ordnen. Den Alltag leichter machen. Entdecke Sproutly, deinen persönlichen KI-Assistenten.",
  apple: "",
  google: "",
  instagram: "https://www.instagram.com/sproutly.ch/",
  facebook: "https://www.facebook.com/profile.php?id=61595130966995",
  tiktok: "https://www.tiktok.com/@sproutly.ch",
  instagramPost: "",
  analyticsEnabled: false,
  company: "",
  address: "",
  contact: "",
  legalVerified: false,
  feedbackRetentionDays: 180,
  contactRetentionDays: 90,
  logRetentionDays: 90,
  seoTitle: "Sproutly – Damit mehr Zeit für dich bleibt",
  seoDescription:
    "Entdecke Sproutly: dein persönlicher KI-Assistent für Aufgaben, Notizen und Projekte. Neuigkeiten, Roadmap und Feedback an einem Ort.",
  indexable: false,
};
const entry = (
  id: string,
  title: string,
  description: string,
  data: Entry["data"],
  position = 0,
): Entry => ({
  id,
  title,
  description,
  data,
  position,
  status: "published",
  slug: null,
  category: "",
  visible: true,
  locale: "de",
  published_at: null,
  created_at: "",
  updated_at: "",
});
export const defaultFeatures = [
  entry(
    "assistant",
    "Ein Gedanke. Ein Anfang.",
    "Halte fest, was dich beschäftigt – mit deinem persönlichen KI-Assistenten.",
    {
      icon: "sparkles",
      media: "/images/assistants.png",
      alt: "KI-Assistenten in einer früheren Sproutly-Version",
    },
  ),
  entry(
    "tasks",
    "Weniger im Kopf. Mehr im Blick.",
    "Aufgaben und Projekte bekommen ihren Platz. Damit du dich auf das Wesentliche konzentrieren kannst.",
    { icon: "check" },
    1,
  ),
  entry(
    "notes",
    "Gute Gedanken bleiben.",
    "Notizen sammeln und Informationen wiederfinden. An einem Ort, der zu deinem Alltag gehört.",
    {
      icon: "notes",
      media: "/images/notes.png",
      alt: "Notizansicht einer früheren Sproutly-Version",
    },
    2,
  ),
];
export const defaultFaqs = [
  entry(
    "what",
    "Was ist Sproutly?",
    "Sproutly ist eine persönliche KI-Assistenten-App für die Organisation von Aufgaben, Notizen und Projekten.",
    {},
  ),
  entry(
    "when",
    "Wo kann ich Sproutly herunterladen?",
    "Die offiziellen Store-Links sind noch nicht hinterlegt. Sobald sie bestätigt sind, findest du sie auf unserer Download-Seite.",
    {},
    1,
  ),
  entry(
    "price",
    "Was kostet Sproutly?",
    "Die verbindlichen Preise werden zum Start bekannt gegeben. Aktuell veröffentlichen wir noch keine Preisangaben.",
    {},
    2,
  ),
  entry(
    "feedback",
    "Wo kann ich meine Ideen teilen?",
    "Im Developer Hub kannst du Funktionen vorschlagen, Fragen stellen und Fehler melden. Beiträge werden vor einer Veröffentlichung geprüft.",
    {},
    3,
  ),
];
const sectionCopy: Record<string, [string, string]> = {
  hero: ["Damit mehr Zeit für dich bleibt.", ""],
  features: [
    "Viel im Kopf? Lass uns Ordnung reinbringen.",
    "Von der ersten Idee bis zum nächsten Schritt. Sproutly begleitet dich beim Organisieren.",
  ],
  how: ["Aus „Ich müsste noch …“ wird ein klarer nächster Schritt.", ""],
  demo: [
    "Weniger erklären. Mehr erleben.",
    "Mach aus einem Gedanken eine Aufgabe und ordne sie einem Projekt zu. Ganz entspannt, ohne Anmeldung.",
  ],
  videos: [
    "Dein Alltag in Bewegung.",
    "Hier findest du künftig freigegebene Einblicke in die App.",
  ],
  news: [
    "Bleib nah dran.",
    "Neuigkeiten, nächste Schritte und deine Ideen: Im Developer Hub wächst Sproutly gemeinsam mit seinem Feedback.",
  ],
  social: [
    "Ein Stück Sproutly in deinem Feed.",
    "Einblicke, Ideen und Neuigkeiten aus der Entwicklung.",
  ],
  faq: ["Noch eine Frage?", "Hier findest du die ersten Antworten."],
  download: [
    "Mach Platz für das, was zählt.",
    "Sproutly begleitet dich auf dem Weg zu mehr Überblick.",
  ],
};
export const defaultSections = Object.entries(sectionCopy).map(
  ([key, [title, description]], i) =>
    entry(key, title, description, { section: key }, i),
);
