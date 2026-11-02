import { beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ staff: vi.fn(), single: vi.fn(), from: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => { throw new Error(`redirect:${path}`); },
  notFound: () => { throw new Error("not-found"); },
}));
vi.mock("@/components/content", () => ({ Blocks: () => null }));
vi.mock("@/lib/security", () => ({
  staff: mocks.staff,
  HttpError: class extends Error { constructor(public status: number) { super("auth"); } },
}));
import Preview from "@/app/admin/preview/[id]/page";
import { HttpError } from "@/lib/security";
const id = "10000000-0000-4000-8000-000000000001";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.from.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: mocks.single }) }) });
  mocks.staff.mockResolvedValue({ db: { from: mocks.from } });
  mocks.single.mockResolvedValue({ data: { title: "Unveröffentlichter Entwurf", description: "Nur intern", category: "Entwicklung", status: "draft", data: { blocks: [] } }, error: null });
});
it("shows saved draft content after requiring news-editing authorization", async () => {
  const html = renderToStaticMarkup(await Preview({ params: Promise.resolve({ id }) }));
  expect(mocks.staff).toHaveBeenCalledWith("developer_news");
  expect(mocks.from).toHaveBeenCalledWith("developer_news");
  expect(html).toContain("Unveröffentlichter Entwurf");
  expect(html).toContain("Veröffentlichungsstatus bleibt unverändert");
});
it.each([401, 403, 503])("does not read draft data when authorization fails (%s)", async (status) => {
  mocks.staff.mockRejectedValue(new HttpError(status, "auth"));
  await expect(Preview({ params: Promise.resolve({ id }) })).rejects.toThrow("redirect:/admin");
  expect(mocks.from).not.toHaveBeenCalled();
});
it("rejects invalid identifiers before reading content", async () => {
  await expect(Preview({ params: Promise.resolve({ id: "invalid" }) })).rejects.toThrow("not-found");
  expect(mocks.from).not.toHaveBeenCalled();
});
it("returns not found for missing entries", async () => {
  mocks.single.mockResolvedValue({ data: null, error: null });
  await expect(Preview({ params: Promise.resolve({ id }) })).rejects.toThrow("not-found");
});
