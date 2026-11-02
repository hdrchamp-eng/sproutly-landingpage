import { copy } from "@/lib/ui-extra";
import { ui } from "@/lib/ui-text";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { entries, feedback, configured, publicDb, settings } from "@/lib/db";
import { metadata, siteUrl } from "@/lib/seo";
import { roadStatuses } from "@/lib/model";
import { FeedbackForm, Vote } from "@/components/interactive";
import { Blocks } from "@/components/content";
import { t } from "@/lib/i18n";
const tabs = [
  ["", copy("ubersicht_4d2bb3")],
  ["news", copy("news_69752f")],
  ["changelog", copy("changelog_ead07c")],
  ["patch-notes", copy("patch_notes_e851fa")],
  ["roadmap", copy("roadmap_92375f")],
  ["feedback", copy("ideen_feedback_e194ef")],
];
type Props = {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<Record<string, string | undefined>>;
};
export async function generateMetadata({ params }: Props) {
  const { path = [] } = await params;
  const site = await settings();
  const title =
    tabs.find(([key]) => key === (path[0] || ""))?.[1] ||
    copy("developer_hub_063b50");
  if (path[0] === "news" && path[1]) {
    const n = (await entries("developer_news")).find((n) => n.slug === path[1]);
    if (n) {
      const base = metadata(
        String(n.data.seoTitle || n.title),
        String(n.data.seoDescription || n.description),
        `/developers/news/${n.slug}`,
        site.indexable && n.data.indexable !== false,
      );
      return {
        ...base,
        openGraph: {
          ...base.openGraph,
          type: "article" as const,
          publishedTime: n.published_at || undefined,
          modifiedTime: n.updated_at,
          ...(n.data.socialImage
            ? { images: [String(n.data.socialImage)] }
            : {}),
        },
      };
    }
  }
  return metadata(
    `${title} – Developer Hub`,
    copy("neuigkeiten_releases_roadmap_und_deine_ideen__710c39"),
    `/developers${path.length ? "/" + path.join("/") : ""}`,
    site.indexable,
  );
}
export default async function Developers({ params, searchParams }: Props) {
  const { path = [] } = await params;
  const tab = path[0] || "";
  if (
    !tabs.some(([key]) => key === tab) ||
    path.length > 2 ||
    (path.length === 2 && tab !== "news")
  )
    notFound();
  const query = await searchParams;
  let content: React.ReactNode;
  if (tab === "news" && path[1]) {
    const n = (await entries("developer_news")).find((n) => n.slug === path[1]);
    if (!n) {
      const db = publicDb();
      if (db) {
        const { data } = await db
          .from("slug_redirects")
          .select("new_slug")
          .eq("locale", "de")
          .eq("old_slug", path[1])
          .maybeSingle();
        if (data) permanentRedirect(`/developers/news/${data.new_slug}`);
      }
      notFound();
    }
    return (
      <div className="container">
        <div className="page-heading">
          <Link href="/developers/news">{ui("page__alle_news_0")}</Link>
          <span className="eyebrow">
            {n.category || copy("neuigkeiten_432880")}
          </span>
          <h1>{n.title}</h1>
          <p>{n.description}</p>
          <small>
            {n.published_at
              ? new Intl.DateTimeFormat("de-CH", { dateStyle: "long" }).format(
                  new Date(n.published_at),
                )
              : ""}
          </small>
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Article",
                  headline: n.title,
                  description: n.description,
                  datePublished: n.published_at,
                  dateModified: n.updated_at,
                  inLanguage: "de-CH",
                  url: `${siteUrl()}/developers/news/${n.slug}`,
                },
                {
                  "@type": "BreadcrumbList",
                  itemListElement: [
                    {
                      "@type": "ListItem",
                      position: 1,
                      name: copy("developer_hub_063b50"),
                      item: `${siteUrl()}/developers`,
                    },
                    {
                      "@type": "ListItem",
                      position: 2,
                      name: n.title,
                      item: `${siteUrl()}/developers/news/${n.slug}`,
                    },
                  ],
                },
              ],
            }).replace(/</g, "\\u003c"),
          }}
        />
        <article className="prose">
          <Blocks blocks={n.data.blocks} />
        </article>
      </div>
    );
  }
  if (tab === "news") {
    const news = await entries("developer_news");
    content = news.length ? (
      <div className="card-grid">
        {news.map((n) => (
          <Link key={n.id} className="card" href={`/developers/news/${n.slug}`}>
            <span className="pill">{n.category || copy("news_69752f")}</span>
            <h3>{n.title}</h3>
            <p>{n.description}</p>
            <small>{n.published_at?.slice(0, 10)}</small>
          </Link>
        ))}
      </div>
    ) : (
      <div className="empty">
        {ui("page_die_ersten_veroffentlichten_neuigkeiten_erscheinen_1")}
      </div>
    );
  } else if (tab === "changelog" || tab === "patch-notes") {
    const releases = await entries("releases");
    const filtered = releases.filter(
      (r) =>
        (!query.platform || r.data.platform === query.platform) &&
        (!query.version || r.data.version === query.version),
    );
    content = (
      <>
        <form className="filters">
          <label>
            {ui("page_plattform_2")}
            <select name="platform" defaultValue={query.platform || ""}>
              <option value="">{ui("page_alle_plattformen_3")}</option>
              <option>{ui("page_ios_4")}</option>
              <option>{ui("page_android_5")}</option>
              <option>{ui("page_alle_6")}</option>
            </select>
          </label>
          <label>
            {ui("page_version_7")}
            <select name="version" defaultValue={query.version || ""}>
              <option value="">{ui("page_alle_versionen_8")}</option>
              {Array.from(
                new Set(releases.map((r) => String(r.data.version))),
              ).map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            {ui("page_kategorie_9")}
            <select name="category" defaultValue={query.category || ""}>
              <option value="">{ui("page_alle_kategorien_10")}</option>
              {[
                copy("added_6b02e0"),
                copy("improved_c3b959"),
                copy("fixed_1246fc"),
                copy("removed_4118fb"),
                copy("security_8f6fb4"),
                copy("known_19984a"),
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <button className="button secondary" type="submit">
            {ui("page_filtern_11")}
          </button>
        </form>
        {filtered.length ? (
          filtered.map((r) => (
            <article className="card release" key={r.id}>
              <span className="pill">
                {String(r.data.platform || copy("alle_3801a3"))}
              </span>
              <small>{r.published_at?.slice(0, 10)}</small>
              <h2>{String(r.data.version || r.title)}</h2>
              <p>{r.description}</p>
              <ul>
                {(Array.isArray(r.data.changes)
                  ? (r.data.changes as { category: string; text: string }[])
                  : []
                )
                  .filter(
                    (c) => !query.category || c.category === query.category,
                  )
                  .map((c, i) => (
                    <li key={i}>
                      <span className="pill">{c.category}</span>
                      {c.text}
                    </li>
                  ))}
              </ul>
            </article>
          ))
        ) : (
          <div className="empty">
            {ui("page_noch_keine_releases_fur_diese_auswahl_veroffentlic_12")}
          </div>
        )}
      </>
    );
  } else if (tab === "roadmap") {
    const items = await entries("roadmap_items");
    content = (
      <>
        <p>
          {ui("page_hier_zeigen_wir_bestatigte_entwicklungsschritte_ze_13")}
        </p>
        <div className="roadmap">
          {roadStatuses.map((status) => (
            <section className="roadmap-column" key={status}>
              <h2>{status}</h2>
              {items
                .filter((i) => i.status === status)
                .map((i) => (
                  <article className="card" key={i.id}>
                    <span className="pill">{i.category}</span>
                    <h3>{i.title}</h3>
                    <p>{i.description}</p>
                    {typeof i.data.period === "string" && (
                      <small>{i.data.period}</small>
                    )}
                  </article>
                ))}
              {!items.some((i) => i.status === status) && (
                <div className="empty">
                  {ui("page_noch_keine_eintrage__14")}
                </div>
              )}
            </section>
          ))}
        </div>
      </>
    );
  } else if (tab === "feedback") {
    const items = await feedback();
    content = (
      <div className="feedback-layout">
        <div>
          <h2>{t.feedback.title}</h2>
          <p>{t.feedback.intro}</p>
          <FeedbackForm
            enabled={
              configured() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
            }
          />
        </div>
        <div>
          <h2>{ui("page_ideen_aus_der_community_15")}</h2>
          <p>
            {ui("page_nur_geprufte_und_freigegebene_beitrage_werden_offe_16")}
          </p>
          {items.length ? (
            items.map((f) => (
              <article className="card feedback-card" key={f.id}>
                <span className="pill">{f.category}</span>
                <h3>{f.title}</h3>
                <p>{f.description}</p>
                <Vote id={f.id} count={Number(f.votes)} />
                {f.responses.map((r, i) => (
                  <div key={i} className="reply">
                    <strong>{ui("page_antwort_von_sproutly_17")}</strong>
                    <p>{r.response}</p>
                  </div>
                ))}
              </article>
            ))
          ) : (
            <div className="empty">
              {ui("page_noch_keine_freigegebenen_vorschlage_vielleicht_beg_18")}
            </div>
          )}
        </div>
      </div>
    );
  } else
    content = (
      <>
        <div className="hub-intro">
          <span className="eyebrow">
            {ui("page_transparent_gemeinsam_schritt_fur_schritt__19")}
          </span>
          <h2>{ui("page_hier_wachst_sproutly_weiter__20")}</h2>
          <p>
            {ui("page_verfolge_die_entwicklung_entdecke_neue_versionen_u_21")}
          </p>
        </div>
        <div className="card-grid">
          {[
            [
              "news",
              copy("aus_der_entwicklung_1f9dcd"),
              copy("neuigkeiten_und_einblicke_hinter_die_kulissen_f5e024"),
            ],
            [
              "changelog",
              copy("was_sich_verandert_5e3629"),
              copy("versionen_verbesserungen_und_behobene_fehler__760340"),
            ],
            [
              "roadmap",
              copy("was_als_nachstes_kommt_06961b"),
              copy("bestatigte_plane_und_ihr_aktueller_stand__1c79dd"),
            ],
            [
              "feedback",
              copy("deine_ideen_zahlen_ef3fca"),
              copy("funktionen_vorschlagen_fragen_stellen_und_fee_651a29"),
            ],
            [
              "patch-notes",
              copy("updates_im_detail_a3324e"),
              copy("alle_anderungen_eines_releases_im_uberblick__fe1ad7"),
            ],
          ].map(([url, title, description]) => (
            <Link href={`/developers/${url}`} className="card" key={url}>
              <ArrowRight size={22} />
              <h3>{title}</h3>
              <p>{description}</p>
            </Link>
          ))}
        </div>
      </>
    );
  return (
    <div className="container">
      <div className="page-heading">
        <span className="eyebrow">{ui("page_sproutly_developer_hub_22")}</span>
        <h1>
          {tab
            ? tabs.find(([key]) => key === tab)?.[1]
            : copy("gemeinsam_weiterdenken__7c7327")}
        </h1>
        {!tab && (
          <p>
            {ui("page_ein_offener_blick_auf_die_entwicklung_und_ein_plat_23")}
          </p>
        )}
      </div>
      <nav className="hub-nav" aria-label={copy("developer_hub_063b50")}>
        {tabs.map(([key, label]) => (
          <Link
            key={key}
            className={key === tab ? "active" : ""}
            href={`/developers${key ? "/" + key : ""}`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <section className="hub-section">{content}</section>
    </div>
  );
}
