import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => { throw new Error(`redirect:${path}`); },
  notFound: () => { throw new Error("not-found"); },
}));
vi.mock("@/components/admin", () => ({
  Login: () => null, Logout: () => null, ContentManager: () => null,
  SettingsForm: () => null, Moderation: () => null, MediaManager: () => null,
}));
vi.mock("@/lib/db", () => ({
  configured: () => true,
  settings: vi.fn(),
  sessionDb: async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "staff-user" } } }),
      mfa: { getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: "aal2" } }) },
    },
    from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: { role: "administrator" } }) }) }) }),
  }),
}));
vi.mock("@/lib/security", () => ({
  staff: async () => ({ role: "administrator" }),
  HttpError: class extends Error {},
}));
import Admin from "@/app/admin/[[...path]]/page";
it("redirects an MFA-verified staff member from the MFA route to the dashboard", async () => {
  await expect(Admin({ params: Promise.resolve({ path: ["mfa"] }), searchParams: Promise.resolve({}) }))
    .rejects.toThrow("redirect:/admin/dashboard");
});
