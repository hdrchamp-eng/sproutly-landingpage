import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
let db: PGlite;
const admin = "00000000-0000-4000-8000-000000000001",
  editor = "00000000-0000-4000-8000-000000000002",
  moderator = "00000000-0000-4000-8000-000000000003";
async function as(role: string, user = "", aal = "aal2") {
  await db.exec(
    `reset role;set request.jwt.claim.sub='${user}';set request.jwt.claim.aal='${aal}';set role ${role};`,
  );
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('aal',current_setting('request.jwt.claim.aal',true)) $$;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid,bucket_id text);alter table storage.objects enable row level security;grant usage on schema public,auth,storage to anon,authenticated,service_role;`,
  );
  await db.exec(
    readFileSync("supabase/migrations/001_core.sql", "utf8").replace(
      "create extension if not exists pgcrypto;",
      "",
    ),
  );
  await db.exec(
    readFileSync("supabase/migrations/002_initial_content.sql", "utf8"),
  );
  await db.exec(
    `grant select,insert,update,delete on all tables in schema public to anon,authenticated,service_role;grant usage,select on all sequences in schema public to anon,authenticated,service_role;insert into auth.users values('${admin}'),('${editor}'),('${moderator}');insert into public.admin_roles(user_id,role) values('${admin}','administrator'),('${editor}','editor'),('${moderator}','moderator');`,
  );
});
afterAll(async () => {
  await db.close();
});
describe("PostgreSQL RLS and workflows", () => {
  it("keeps unpublished news private and permits editor publication", async () => {
    await as("authenticated", editor);
    await db.exec(
      `insert into developer_news(title,slug) values('Private draft','private-draft')`,
    );
    await as("anon");
    expect((await db.query("select * from developer_news")).rows).toHaveLength(
      0,
    );
    await as("authenticated", editor);
    await db.exec(
      `update developer_news set status='published',published_at=now() where slug='private-draft'`,
    );
    await as("anon");
    expect(
      (await db.query("select title from developer_news")).rows,
    ).toHaveLength(1);
  });
  it("rejects editor role escalation and settings mutation", async () => {
    await as("authenticated", editor);
    await expect(
      db.exec(
        `insert into admin_roles values(gen_random_uuid(),'administrator',now())`,
      ),
    ).rejects.toThrow();
    await expect(
      db.exec(`insert into site_settings values('site','{}',now())`),
    ).rejects.toThrow();
  });
  it("requires MFA for writes", async () => {
    await as("authenticated", admin, "aal1");
    await expect(
      db.exec(`insert into developer_news(title) values('Blocked')`),
    ).rejects.toThrow();
  });
  it("moderator cannot publish news", async () => {
    await as("authenticated", moderator);
    await expect(
      db.exec(`insert into developer_news(title) values('Blocked')`),
    ).rejects.toThrow();
  });
  it("submits privately, moderates, votes once and protects contact data", async () => {
    await as("service_role");
    const result = await db.query<{ id: string }>(
      `select submit_feedback('Neue Ansicht','Eine ausreichend lange Beschreibung','Verbesserung','private@example.test') as id`,
    );
    const id = result.rows[0].id;
    await as("anon");
    expect(
      (await db.query("select * from public_feedback()")).rows,
    ).toHaveLength(0);
    expect(
      (await db.query("select * from feedback_contacts")).rows,
    ).toHaveLength(0);
    await expect(
      db.exec(
        `insert into feedback_submissions(title,description,category,status) values('Bad','Long description enough','Verbesserung','Freigegeben')`,
      ),
    ).rejects.toThrow();
    await as("authenticated", moderator);
    expect(
      (await db.query("select * from feedback_contacts")).rows,
    ).toHaveLength(0);
    await db.exec(
      `update feedback_submissions set status='Freigegeben',internal_note='Secret moderation note' where id='${id}'`,
    );
    await db.exec(
      `insert into feedback_responses(feedback_id,administrator_id,response) values('${id}','${moderator}','Danke für deine Idee.')`,
    );
    await as("service_role");
    expect(
      (
        await db.query<{ v: boolean }>(
          `select vote_feedback('${id}','voter-1') as v`,
        )
      ).rows[0].v,
    ).toBe(true);
    expect(
      (
        await db.query<{ v: boolean }>(
          `select vote_feedback('${id}','voter-1') as v`,
        )
      ).rows[0].v,
    ).toBe(false);
    await as("anon");
    const publicRows = (await db.query("select * from public_feedback()")).rows;
    expect(publicRows).toHaveLength(1);
    expect(JSON.stringify(publicRows)).not.toContain("private@example");
    expect(JSON.stringify(publicRows)).not.toContain("Secret moderation");
    expect(JSON.stringify(publicRows)).toContain("Danke für deine Idee.");
    await as("authenticated", moderator);
    await db.exec(`delete from feedback_submissions where id='${id}'`);
    await as("service_role");
    expect(
      (await db.query("select * from feedback_contacts")).rows,
    ).toHaveLength(0);
    expect((await db.query("select * from feedback_votes")).rows).toHaveLength(
      0,
    );
  });
  it("enforces atomic limits", async () => {
    await as("service_role");
    expect(
      (
        await db.query<{ ok: boolean }>(
          `select consume_limit('test',1,60) as ok`,
        )
      ).rows[0].ok,
    ).toBe(true);
    expect(
      (
        await db.query<{ ok: boolean }>(
          `select consume_limit('test',1,60) as ok`,
        )
      ).rows[0].ok,
    ).toBe(false);
  });
  it("isolates audit logs and preserves slug redirects", async () => {
    await as("authenticated", editor);
    expect((await db.query("select * from audit_logs")).rows).toHaveLength(0);
    await db.exec(
      `update developer_news set slug='new-slug' where slug='private-draft'`,
    );
    await as("anon");
    expect((await db.query("select * from slug_redirects")).rows).toHaveLength(
      1,
    );
    await as("authenticated", admin);
    expect(
      (await db.query("select * from audit_logs")).rows.length,
    ).toBeGreaterThan(0);
  });
});
