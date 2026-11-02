import { beforeEach, describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
const rpc = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db", () => ({
  serviceDb: () => ({ rpc }),
  sessionDb: async () => null,
}));
import { POST as submit } from "@/app/api/feedback/route";
import { POST as admin } from "@/app/api/admin/[resource]/route";
const valid = {
  title: "Mehr Übersicht",
  description: "Ich wünsche mir eine bessere Sortierung.",
  category: "Verbesserung",
  email: "optional@example.test",
  website: "",
  startedAt: Date.now() - 5000,
};
const request = (data: unknown, origin = "http://localhost:3000") =>
  new Request("http://localhost:3000/api/feedback", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(data),
  });
beforeEach(() => {
  process.env.RATE_LIMIT_SECRET = "test-only-not-a-real-secret-123456789";
  delete process.env.NEXT_PUBLIC_SITE_URL;
  rpc.mockReset();
  rpc.mockResolvedValue({ data: true, error: null });
});
describe("server route boundaries", () => {
  it("accepts valid feedback through controlled RPC and does not return contact data", async () => {
    const response = await submit(request(valid));
    expect(response.status).toBe(201);
    expect(rpc).toHaveBeenCalledWith("submit_feedback", {
      p_title: valid.title,
      p_description: valid.description,
      p_category: valid.category,
      p_email: valid.email,
    });
    expect(await response.text()).not.toContain(valid.email);
  });
  it("rejects cross-origin before database access", async () => {
    expect((await submit(request(valid, "https://attacker.test"))).status).toBe(
      403,
    );
    expect(rpc).not.toHaveBeenCalled();
  });
  it("rejects honeypot and privilege injection", async () => {
    expect((await submit(request({ ...valid, website: "spam" }))).status).toBe(
      400,
    );
    expect(
      (await submit(request({ ...valid, status: "Freigegeben" }))).status,
    ).toBe(400);
  });
  it("enforces distributed limit before insert", async () => {
    rpc.mockResolvedValueOnce({ data: false, error: null });
    expect((await submit(request(valid))).status).toBe(429);
    expect(rpc).toHaveBeenCalledTimes(1);
  });
  it("does not expose database errors or secrets", async () => {
    rpc
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({
        data: null,
        error: new Error("private SQL and token"),
      });
    const result = await submit(request(valid));
    expect(result.status).toBe(503);
    expect(await result.text()).not.toContain("private SQL");
  });
  it("blocks unauthenticated admin writes", async () => {
    const result = await admin(
      request({ operation: "save", value: { title: "Attack" } }),
      { params: Promise.resolve({ resource: "developer_news" }) },
    );
    expect(result.status).toBe(503);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("bounds JSON body size", async () => {
    expect(
      (await submit(request({ description: "x".repeat(130000) }))).status,
    ).toBe(413);
  });
});
