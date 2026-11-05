import { copy } from "@/lib/ui-extra";
import { ui } from "@/lib/ui-text";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { entries, feedback, publicDb, settings } from "@/lib/db";
import { metadata, siteUrl } from "@/lib/seo";

import { Community } from "@/components/community";
import { Blocks } from "@/components/content";

const tabs = [
  ["", copy("ubersicht_4d2bb3")],
  ["news", copy("news_69752f")],
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
    "Neuigkeiten, Community-Ideen und Abstimmungen rund um Sproutly.",
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
  void searchParams;
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
  } else if (tab === "feedback") {
    content = <Community ideas={await feedback()} />;
  } else
    content = (
      <>
        <div className="hub-intro">
          <span className="eyebrow">
            {ui("page_transparent_gemeinsam_schritt_fur_schritt__19")}
          </span>
          <h2>{ui("page_hier_wachst_sproutly_weiter__20")}</h2>
          <p>
            Entdecke Neuigkeiten, teile deine Ideen und gestalte Sproutly mit.
          </p>
        </div>
        <div className="card-grid">
          {[
            [
              "news",
              "Aus der Entwicklung",
              "Neuigkeiten und Einblicke hinter die Kulissen.",
            ],
            [
              "feedback",
              "Deine Ideen zählen",
              "Funktionen vorschlagen, Fragen stellen und Feedback teilen.",
            ],
            [
              "feedback#polls",
              "Gemeinsam entscheiden",
              "Entdecke die Abstimmungen aus der Community.",
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
