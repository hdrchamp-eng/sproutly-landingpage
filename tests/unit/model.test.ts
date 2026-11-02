import { describe, it, expect } from "vitest";
import {
  feedbackSchema,
  storeUrl,
  preferredStore,
  canEdit,
  entrySchema,
  settingsSchema,
  blockSchema,
} from "@/lib/model";
import { defaults } from "@/lib/defaults";
const valid = {
  title: "Eine praktische Idee",
  description: "Das wäre eine hilfreiche Verbesserung.",
  category: "Verbesserung",
  email: "",
  website: "",
  startedAt: Date.now() - 3000,
};
describe("public input boundary", () => {
  it("accepts optional contact and valid feedback", () =>
    expect(feedbackSchema.safeParse(valid).success).toBe(true));
  it.each([
    { title: "x".repeat(81) },
    { description: "x".repeat(501) },
    { website: "spam" },
    { email: "invalid" },
    { category: "unknown" },
    { status: "Freigegeben" },
  ])("rejects malformed or privileged fields %o", (change) =>
    expect(feedbackSchema.safeParse({ ...valid, ...change }).success).toBe(
      false,
    ),
  );
  it("rejects injected block URLs", () => {
    expect(
      blockSchema.safeParse({
        type: "link",
        text: "x",
        url: "javascript:alert(1)",
      }).success,
    ).toBe(false);
    expect(
      blockSchema.safeParse({
        type: "image",
        text: "x",
        url: "//evil.example/x",
      }).success,
    ).toBe(false);
  });
});
describe("store routing", () => {
  it("allows official HTTPS store hosts only", () => {
    expect(storeUrl("https://apps.apple.com/ch/app/id123", "apple")).toBe(true);
    expect(storeUrl("https://apps.apple.com.evil.test/", "apple")).toBe(false);
    expect(storeUrl("http://play.google.com/store", "google")).toBe(false);
    expect(
      storeUrl("https://user:password@play.google.com/store", "google"),
    ).toBe(false);
  });
  it("recommends without forcing navigation", () => {
    expect(preferredStore("iPhone")).toBe("apple");
    expect(preferredStore("Android")).toBe("google");
    expect(preferredStore("Desktop")).toBe(null);
  });
});
describe("least privilege", () => {
  it("restricts editors and moderators", () => {
    expect(canEdit("editor", "site_settings")).toBe(false);
    expect(canEdit("editor", "feedback_submissions")).toBe(false);
    expect(canEdit("moderator", "developer_news")).toBe(false);
    expect(canEdit("moderator", "feedback_submissions")).toBe(true);
    expect(canEdit("administrator", "site_settings")).toBe(true);
  });
  it("validates settings and forbids secret-shaped extra fields", () => {
    expect(settingsSchema.safeParse(defaults).success).toBe(true);
    expect(
      settingsSchema.safeParse({ ...defaults, apiKey: "private" }).success,
    ).toBe(false);
    expect(
      settingsSchema.safeParse({ ...defaults, apple: "https://example.org" })
        .success,
    ).toBe(false);
  });
  it("rejects malformed publication and unsafe media", () => {
    const e = {
      title: "News",
      description: "",
      status: "published",
      slug: "news",
      category: "",
      position: 0,
      visible: true,
      locale: "de",
      data: {},
      published_at: null,
    };
    expect(entrySchema.safeParse(e).success).toBe(true);
    expect(
      entrySchema.safeParse({ ...e, data: { media: "javascript:alert(1)" } })
        .success,
    ).toBe(false);
    expect(entrySchema.safeParse({ ...e, status: "secret" }).success).toBe(
      false,
    );
  });
});
