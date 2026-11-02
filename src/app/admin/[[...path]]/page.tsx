import { copy } from "@/lib/ui-extra";
import { ui } from "@/lib/ui-text";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { sessionDb, settings, configured } from "@/lib/db";
import { staff, HttpError } from "@/lib/security";
import { canEdit, type Entry, type Resource } from "@/lib/model";
import {
  Login,
  Logout,
  ContentManager,
  SettingsForm,
  Moderation,
  MediaManager,
  type Media,
  type ModerationEntry,
} from "@/components/admin";
export const dynamic = "force-dynamic";
export const metadata = {
  title: copy("administration_4b42c6"),
  robots: { index: false, follow: false },
};
const pages = [
  ["dashboard", copy("ubersicht_4d2bb3"), null],
  ["content", copy("seitenabschnitte_e5aa49"), "page_sections"],
  ["features", copy("funktionskarten_f1ff7b"), "feature_cards"],
  ["faq", "FAQ", "faqs"],
  ["testimonials", copy("kundenstimmen_551c49"), "testimonials"],
  ["news", copy("developer_news_8306f9"), "developer_news"],
  ["changelog", copy("releases_patch_notes_0d4ab8"), "releases"],
  ["roadmap", copy("roadmap_92375f"), "roadmap_items"],
  ["feedback", copy("feedbackmoderation_d13345"), "feedback_submissions"],
  ["media", copy("medienbibliothek_1a42b1"), "media_assets"],
  ["settings", copy("einstellungen_f5750a"), "site_settings"],
  ["analytics", copy("statistik_6789eb"), null],
  ["audit", copy("audit_log_409859"), null],
] as const;
export default async function Admin({
  params,
  searchParams,
}: {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { path = [] } = await params;
  const page = path[0] || "dashboard";
  if (
    path.length > 1 ||
    (!pages.some((p) => p[0] === page) && !["login", "mfa"].includes(page))
  )
    notFound();
  const db = await sessionDb();
  if (page === "login")
    return (
      <div className="container">
        <Login enabled={configured()} />
      </div>
    );
  if (!db)
    return (
      <div className="container">
        <Login enabled={false} />
      </div>
    );
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: role } = await db
    .from("admin_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  if (!role)
    return (
      <div className="container error-page">
        <h1>{ui("page_kein_verwaltungszugang__0")}</h1>
        <p>{ui("page_dieses_konto_wurde_nicht_fur_die_website_verwaltun_1")}</p>
        <Logout />
      </div>
    );
  const { data: aal } = await db.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") {
    const { data: factors } = await db.auth.mfa.listFactors();
    return (
      <div className="container">
        <Login
          enabled
          needsMfa
          factorId={factors?.totp.find((f) => f.status === "verified")?.id}
        />
      </div>
    );
  }
  let session;
  try {
    session = await staff();
  } catch (e) {
    if (e instanceof HttpError && e.status === 401) redirect("/admin/login");
    throw e;
  }
  if (page === "mfa") redirect("/admin/dashboard");
  const selected = pages.find((p) => p[0] === page)!;
  if (
    (selected[2] && !canEdit(session.role, selected[2])) ||
    (["analytics", "audit", "settings"].includes(page) &&
      session.role !== "administrator")
  )
    return (
      <div className="container error-page">
        <h1>{ui("page_keine_berechtigung__2")}</h1>
        <Link href="/admin/dashboard">{ui("page_zur_ubersicht_3")}</Link>
      </div>
    );
  let content: React.ReactNode;
  if (page === "dashboard") {
    const s = await settings();
    const [news, feedback, roadmap, releases] = await Promise.all([
      db
        .from("developer_news")
        .select("id,title,status,updated_at")
        .order("updated_at", { ascending: false }),
      db
        .from("feedback_submissions")
        .select("id,title,status,created_at")
        .order("created_at", { ascending: false }),
      db.from("roadmap_items").select("id,status"),
      db.from("releases").select("id,status"),
    ]);
    const cards = [
      [
        copy("veroffentlichte_news_7627b6"),
        news.data?.filter((n) => n.status === "published").length || 0,
      ],
      [
        copy("news_entwurfe_a36e43"),
        news.data?.filter((n) => n.status === "draft").length || 0,
      ],
      [
        copy("offenes_feedback_f32fa5"),
        feedback.data?.filter((f) =>
          [copy("eingegangen_78e314"), copy("in_prufung_b3c82b")].includes(
            f.status,
          ),
        ).length || 0,
      ],
      [
        copy("freigegebene_ideen_008959"),
        feedback.data?.filter((f) => f.status === copy("freigegeben_ed0404"))
          .length || 0,
      ],
      [
        copy("aktive_roadmap_eintrage_e6f06e"),
        roadmap.data?.filter((r) => r.status !== "archived").length || 0,
      ],
      [
        copy("veroffentlichte_releases_73816d"),
        releases.data?.filter((r) => r.status === "published").length || 0,
      ],
    ];
    content = (
      <>
        <div className="admin-grid">
          {cards.map(([label, count]) => (
            <div className="card stat" key={label}>
              <strong>{count}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <h2 style={{ marginTop: 35 }}>{ui("page_konfigurationsstatus_4")}</h2>
        <div className="card">
          <p>
            {ui("page_apple_app_store__5")}
            {s.apple ? "konfiguriert" : "noch offen"}
            <br />
            {ui("page_google_play__6")}
            {s.google ? "konfiguriert" : "noch offen"}
            <br />
            {ui("page_instagram__7")}
            {s.instagram ? copy("profil_verlinkt_2745e8") : "noch offen"}
            {ui("page__feed__8")}{" "}
            {s.instagramPost
              ? copy("manueller_beitrag_356966")
              : copy("kein_beitrag_ausgewahlt_773c6d")}
            <br />
            {ui("page_statistik__9")}{" "}
            {s.analyticsEnabled
              ? copy("aktiv_nach_einwilligung_1fc879")
              : "deaktiviert"}
            <br />
            {ui("page_rechtliche_angaben__10")}{" "}
            {s.legalVerified
              ? copy("als_gepruft_markiert_e39f74")
              : copy("prufung_ausstehend_92b279")}
            <br />
            {ui("page_offizielle_domain__11")}{" "}
            {process.env.NEXT_PUBLIC_SITE_URL ? "konfiguriert" : "noch offen"}
          </p>
        </div>
        <h2 style={{ marginTop: 35 }}>{ui("page_letztes_feedback_12")}</h2>
        {feedback.data?.slice(0, 5).map((f) => (
          <p key={f.id}>
            {f.title}
            {ui("page___13")}
            {f.status}
          </p>
        ))}
        {!feedback.data?.length && (
          <p>{ui("page_noch_keine_fur_deine_rolle_sichtbaren_beitrage__14")}</p>
        )}
        <h2>{ui("page_zuletzt_bearbeitete_news_15")}</h2>
        {news.data?.slice(0, 5).map((n) => (
          <p key={n.id}>
            {n.title}
            {ui("page___16")}
            {n.status}
          </p>
        ))}
        <h2>{ui("page_zuletzt_veroffentlichte_news_17")}</h2>
        {news.data
          ?.filter((n) => n.status === "published")
          .slice(0, 5)
          .map((n) => (
            <p key={n.id}>{n.title}</p>
          ))}
      </>
    );
  } else if (page === "settings")
    content = <SettingsForm initial={await settings()} />;
  else if (page === "feedback") {
    const { data, error } = await db
      .from("feedback_submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    content = <Moderation initial={data as ModerationEntry[]} />;
  } else if (page === "media") {
    const { data, error } = await db
      .from("media_assets")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    let all = "";
    for (const p of pages) {
      if (p[2] && p[2] !== "media_assets" && p[2] !== "feedback_submissions") {
        const { data: records, error: readError } = await db
          .from(p[2])
          .select("*");
        if (readError) throw readError;
        all += JSON.stringify(records);
      }
    }
    content = (
      <MediaManager
        initial={
          (data || []).map((m) => ({
            ...m,
            used: all.includes(m.path),
          })) as Media[]
        }
        baseUrl={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-media/`}
      />
    );
  } else if (page === "analytics") {
    const query = await searchParams;
    const now = new Date();
    const today = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Zurich",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
    const days =
      query.period === "today"
        ? 0
        : query.period === "yesterday"
          ? 1
          : query.period === "7"
            ? 6
            : 29;
    const dateOffset = (d: number) =>
      new Date(Date.parse(today + "T12:00:00Z") - d * 86400000)
        .toISOString()
        .slice(0, 10);
    const valid = (v: string | undefined) =>
      v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null;
    const from =
      query.period === "custom"
        ? valid(query.from) || dateOffset(29)
        : dateOffset(days);
    const to =
      query.period === "custom"
        ? valid(query.to) || today
        : query.period === "yesterday"
          ? dateOffset(1)
          : today;
    const { data, error } = await db
      .from("analytics_daily")
      .select("*")
      .gte("day", from)
      .lte("day", to)
      .order("day", { ascending: false });
    if (error) throw error;
    const sum = (event: string) =>
      (data || [])
        .filter((r) => r.event === event)
        .reduce((a, r) => a + Number(r.count), 0);
    const views = sum("pageview"),
      apple = sum("apple"),
      google = sum("google");
    content = (
      <>
        <p>
          {ui("page_gemessene_ereignisse_nach_einwilligung_store_klick_18")}
        </p>
        <form className="filters">
          <label>
            {ui("page_zeitraum_19")}
            <select name="period" defaultValue={query.period || "30"}>
              <option value="today">{ui("page_heute_20")}</option>
              <option value="yesterday">{ui("page_gestern_21")}</option>
              <option value="7">{ui("page_letzte_7_tage_22")}</option>
              <option value="30">{ui("page_letzte_30_tage_23")}</option>
              <option value="custom">{ui("page_benutzerdefiniert_24")}</option>
            </select>
          </label>
          <label>
            {ui("page_von_25")}
            <input type="date" name="from" defaultValue={from} />
          </label>
          <label>
            {ui("page_bis_26")}
            <input type="date" name="to" defaultValue={to} />
          </label>
          <button className="button secondary">{ui("page_anwenden_27")}</button>
        </form>
        {data?.length ? (
          <>
            <div className="admin-grid">
              {[
                [copy("seitenaufrufe_329fae"), views],
                [copy("store_klicks_2967dd"), apple + google],
                [
                  copy("klicks_seitenaufrufe_feead9"),
                  views
                    ? `${(((apple + google) / views) * 100).toFixed(1)} %`
                    : "–",
                ],
                [copy("apple_app_store_76654b"), apple],
                [copy("google_play_027b16"), google],
                [copy("feedback_ereignisse_b503b7"), sum("feedback")],
              ].map(([label, value]) => (
                <div className="card stat" key={label}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
            <div className="table-wrap">
              <table>
                <caption>
                  {ui("page_tageswerte_nach_seite_und_ereignis_28")}
                </caption>
                <thead>
                  <tr>
                    <th>{ui("page_datum_29")}</th>
                    <th>{ui("page_seite_30")}</th>
                    <th>{ui("page_ereignis_31")}</th>
                    <th>{ui("page_anzahl_32")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((r) => (
                    <tr key={`${r.day}-${r.event}-${r.path}`}>
                      <td>{r.day}</td>
                      <td>{r.path}</td>
                      <td>{r.event}</td>
                      <td>{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="empty">
            {ui("page_fur_diesen_zeitraum_sind_keine_messwerte_vorhanden_33")}
          </div>
        )}
      </>
    );
  } else if (page === "audit") {
    const { data, error } = await db
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    content = (
      <>
        <p>
          {ui("page_letzte_200_administrative_datenanderungen_authenti_34")}
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{ui("page_zeit_35")}</th>
                <th>{ui("page_aktion_36")}</th>
                <th>{ui("page_bereich_37")}</th>
                <th>{ui("page_datensatz_38")}</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((r) => (
                <tr key={r.id}>
                  <td>{r.created_at}</td>
                  <td>{r.action}</td>
                  <td>{r.resource}</td>
                  <td>{r.record_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  } else {
    const resource = selected[2] as Resource;
    const { data, error } = await db
      .from(resource)
      .select("*")
      .order("position");
    if (error) throw error;
    content = <ContentManager resource={resource} initial={data as Entry[]} />;
  }
  return (
    <div className="container admin-shell">
      <aside>
        <span className="eyebrow">{ui("page_website_verwalten_39")}</span>
        <nav className="admin-nav" aria-label={copy("administration_4b42c6")}>
          {pages
            .filter(
              (p) =>
                (!p[2] || canEdit(session.role, p[2])) &&
                (!["analytics", "audit", "settings"].includes(p[0]) ||
                  session.role === "administrator"),
            )
            .map(([key, title]) => (
              <Link
                className={page === key ? "active" : ""}
                key={key}
                href={`/admin/${key}`}
              >
                {title}
              </Link>
            ))}
        </nav>
        <Logout />
      </aside>
      <div className="admin-main">
        <h1>{selected[1]}</h1>
        {content}
      </div>
    </div>
  );
}
