import { readFileSync } from "node:fs";
import { it, expect } from "vitest";
import * as defaults from "@/lib/defaults";
import { seedSql } from "../../scripts/generate-seed.mjs";
it("generates initial content from verified defaults", () => {
  const sql = seedSql(defaults);
  expect(sql).not.toContain("insert into public.releases");
  expect(
    readFileSync("supabase/migrations/002_initial_content.sql", "utf8"),
  ).toBe(sql);
});
