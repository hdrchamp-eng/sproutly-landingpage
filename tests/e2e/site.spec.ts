import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("landing, demo, FAQ and download navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "mehr Zeit",
  );
  await page.getByRole("link", { name: "Einfach ausprobieren" }).click();
  await page.getByRole("button", { name: "Aufgabe hinzufügen" }).click();
  await expect(page.locator(".demo-result")).toContainText("Wochenende");
  await page.getByText("Was ist Sproutly?", { exact: true }).click();
  await expect(page.locator("details[open]")).toContainText(
    "KI-Assistenten-App",
  );
  await page.getByRole("link", { name: "Alle Download-Infos" }).click();
  await expect(page).toHaveURL(/downloads/);
  await expect(
    page.getByText("Es ist noch kein bestätigter Store-Link hinterlegt."),
  ).toBeVisible();
});
for (const width of [320, 375, 390, 615, 768, 1024, 1440])
  test(`responsive width ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      "/",
      "/developers",
      "/developers/feedback",
      "/downloads",
      "/admin/login",
    ]) {
      await page.goto(path);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    if (width < 760) {
      await page.getByRole("button", { name: "Menü öffnen" }).click();
      await expect(page.locator("#main-nav")).toBeVisible();
      await page
        .locator("#main-nav")
        .getByRole("link", { name: "Developer Hub" })
        .click();
      await expect(page).toHaveURL(/developers/);
    }
  });
test("no critical accessibility findings on public pages", async ({ page }) => {
  for (const path of [
    "/",
    "/developers/feedback",
    "/downloads",
    "/admin/login",
  ]) {
    await page.goto(path);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => n.target),
      })),
    ).toEqual([]);
  }
});
test("unauthorized writes, invalid feedback and cross-origin requests fail closed", async ({
  request,
}) => {
  const headers = { origin: "http://127.0.0.1:3000" };
  const admin = await request.post("/api/admin/developer_news", {
    headers,
    data: { operation: "save", value: { title: "Attack" } },
  });
  expect([404]).toContain(admin.status());
  const csrf = await request.post("/api/feedback", {
    headers: { origin: "https://evil.test" },
    data: {},
  });
  expect(csrf.status()).toBe(403);
  const malformed = await request.post("/api/feedback", {
    headers,
    data: { title: "x".repeat(81), status: "Freigegeben" },
  });
  expect(malformed.status()).toBe(400);
  const upload = await request.post("/api/admin/media", {
    headers,
    multipart: {
      file: {
        name: "attack.svg",
        mimeType: "image/svg+xml",
        buffer: Buffer.from('<svg onload="alert(1)"/>'),
      },
    },
  });
  expect([404]).toContain(upload.status());
});
test("all routes, metadata and no external requests before consent", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (
      !r.url().startsWith("http://127.0.0.1:3000") &&
      !r.url().startsWith("data:")
    )
      external.push(r.url());
  });
  for (const path of [
    "/",
    "/developers/news",
    "/developers/changelog",
    "/developers/patch-notes",
    "/developers/roadmap",
    "/developers/feedback",
    "/datenschutz",
    "/impressum",
    "/downloads",
  ]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
  }
  expect(external).toEqual([]);
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL("http://127.0.0.1:3000/");
  await expect(page.getByRole("heading", {level: 1})).toContainText("für dich bleibt.");
});

test("keyboard navigation, reduced motion and visual records", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "für dich bleibt.",
  );
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Zum Inhalt springen" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main/);
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
  ).toBe("auto");
  await page.goto("/");
  await page.screenshot({
    path: "docs/screenshots/landing-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "docs/screenshots/landing-mobile.png",
    fullPage: true,
  });
});
