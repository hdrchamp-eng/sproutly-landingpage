import { copy } from "@/lib/ui-extra";
import { ui } from "@/lib/ui-text";
export const revalidate = 60;
import Image from "next/image";
import { latestInstagramPost } from "@/lib/instagram";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  MessageCircle,
  Sparkles,
  NotebookPen,
  Folder,
  Mic,
  LayoutGrid,
} from "lucide-react";
import { entries, settings } from "@/lib/db";
import {
  Demo,
  Faq,
  ExternalPost,
  SocialLink,
  StoreButtons,
  ProductVideo,
  ExternalVideo,
} from "@/components/interactive";
import { metadata, siteUrl } from "@/lib/seo";
import type { Entry } from "@/lib/model";
export async function generateMetadata() {
  const s = await settings();
  return metadata(s.seoTitle, s.seoDescription, "/", s.indexable);
}
const icons = {
  sparkles: Sparkles,
  check: CheckCheck,
  notes: NotebookPen,
  folder: Folder,
  mic: Mic,
  grid: LayoutGrid,
};
export default async function Home() {
  const [s, features, faqs, sections, news, testimonials] = await Promise.all([
    settings(),
    entries("feature_cards"),
    entries("faqs"),
    entries("page_sections"),
    entries("developer_news"),
    entries("testimonials"),
  ]);
  const instagramPost = await latestInstagramPost(s.instagramPost);
  const show = (section: Entry) => {
    const type = section.data.section;
    switch (type) {
      case "hero":
        return (
          <div className="container" key={section.id}>
            <section
              className="hero"
              style={{
                background:
                  section.data.background === "lilac"
                    ? "var(--lilac)"
                    : section.data.background === "mint"
                      ? "var(--mint)"
                      : undefined,
              }}
            >
              <div>
                <span className="eyebrow">
                  {ui("page_ein_bisschen_weniger_mussen__0")}
                </span>
                <h1>
                  {s.heroTitle ===
                  copy("damit_mehr_zeit_fur_dich_bleibt__c7e571") ? (
                    <>
                      {ui("page_damit_mehr_zeit_1")}
                      <br />
                      {ui("page_fur_2")} <em>{ui("page_dich_3")}</em>{" "}
                      {ui("page_bleibt__4")}
                    </>
                  ) : (
                    s.heroTitle
                  )}
                </h1>
                <p className="intro">{s.heroSubtitle}</p>
                <div className="actions">
                  <Link className="button" href="/downloads">
                    {ui("page_sproutly_entdecken_5")}
                    <ArrowRight size={18} />
                  </Link>
                  <a className="button secondary" href="#demo">
                    {ui("page_einfach_ausprobieren_6")}
                    <ArrowUpRight size={18} />
                  </a>
                </div>
                <div className="trust-line">
                  <span className="pill">{ui("page_in_vorbereitung_7")}</span>
                  <span>{ui("page_fur_ios_und_android_geplant_8")}</span>
                </div>
              </div>
              <div className="hero-art">
                <div className="hero-orbit" />
                <div className="phone">
                  <Image
                    src={
                      typeof section.data.media === "string"
                        ? section.data.media
                        : "/images/notes.png"
                    }
                    alt={copy(
                      "sproutly_notizen_aufnahme_einer_fruheren_app__ed974b",
                    )}
                    width={632}
                    height={1392}
                    preload
                    fetchPriority="high"
                    sizes="(max-width:760px) 215px, 238px"
                  />
                </div>
                <div className="float-card top">
                  <MessageCircle size={25} />
                  <div>
                    <strong>{ui("page_gedanken_festhalten__9")}</strong>
                    <small>
                      {ui("page_platz_schaffen_fur_neue_ideen__10")}
                    </small>
                  </div>
                </div>
                <div className="float-card bottom">
                  <Check size={23} />
                  <div>
                    <strong>
                      {ui("page_ein_bisschen_mehr_uberblick__11")}
                    </strong>
                    <small>{ui("page_ein_bisschen_mehr_du__12")}</small>
                  </div>
                </div>
                <p className="hero-caption">
                  {ui(
                    "page_originalaufnahme_einer_fruheren_sproutly_version__13",
                  )}
                </p>
              </div>
            </section>
          </div>
        );
      case "features":
        return (
          <section
            className="section soft-section"
            id="features"
            key={section.id}
          >
            <div className="container">
              <div className="section-head">
                <div>
                  <span className="eyebrow">
                    {ui("page_ein_platz_fur_deinen_alltag_14")}
                  </span>
                  <h2>{section.title}</h2>
                </div>
                <p>{section.description}</p>
              </div>
              <div className="feature-grid">
                {features.map((f, i) => {
                  const Icon =
                    icons[f.data.icon as keyof typeof icons] || Sparkles;
                  return (
                    <article className="feature" key={f.id}>
                      <div className="icon">
                        <Icon size={23} />
                      </div>
                      <div className="feature-index">
                        {ui("page_0_15")}
                        {i + 1}
                        {ui("page___16")}{" "}
                        {i === 0
                          ? "DEIN ASSISTENT"
                          : i === 1
                            ? "DEINE AUFGABEN"
                            : "DEINE NOTIZEN"}
                      </div>
                      <h3>{f.title}</h3>
                      <p>{f.description}</p>
                      {typeof f.data.media === "string" && f.data.media && (
                        <details>
                          <summary>
                            {ui("page_app_einblick_ansehen_17")}
                          </summary>
                          <Image
                            src={f.data.media}
                            alt={String(f.data.alt || f.title)}
                            width={400}
                            height={700}
                            sizes="300px"
                            style={{
                              maxHeight: 380,
                              width: "auto",
                              margin: "20px auto",
                            }}
                          />
                          <small>
                            {ui("page_aufnahme_einer_fruheren_app_version__18")}
                          </small>
                        </details>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        );
      case "how":
        return (
          <section className="section container" id="how" key={section.id}>
            <div className="section-head">
              <div>
                <span className="eyebrow">
                  {ui("page_so_funktioniert_s_19")}
                </span>
                <h2>{section.title}</h2>
              </div>
            </div>
            <div className="steps">
              {[
                [
                  copy("festhalten_99de88"),
                  copy("eine_aufgabe_eine_notiz_ein_gedanke_gib_dem_w_baf3ec"),
                ],
                [
                  copy("ordnen_389331"),
                  copy("bringe_zusammen_was_zusammengehort_schaffe_ub_8518cc"),
                ],
                [
                  copy("durchatmen_cfc751"),
                  copy("weniger_gedankliche_zettelwirtschaft_mehr_auf_6d8ae3"),
                ],
              ].map(([h, p], i) => (
                <article key={h}>
                  <span className="step-number">
                    {ui("page_0_20")}
                    {i + 1}
                  </span>
                  <h3>{h}</h3>
                  <p>{p}</p>
                </article>
              ))}
            </div>
          </section>
        );
      case "demo":
        return (
          <section className="section soft-section" id="demo" key={section.id}>
            <div className="container split">
              <div>
                <span className="eyebrow">
                  {ui("page_einfach_mal_ausprobieren_21")}
                </span>
                <h2>{section.title}</h2>
                <p>{section.description}</p>
                <p className="fine">
                  {ui(
                    "page_diese_website_demo_arbeitet_ausschliesslich_mit_te_22",
                  )}
                </p>
              </div>
              <Demo />
            </div>
          </section>
        );
      case "videos":
        return (
          <section className="section container" key={section.id}>
            <div className="section-head">
              <div>
                <span className="eyebrow">
                  {ui("page_ein_blick_in_sproutly_23")}
                </span>
                <h2>{section.title}</h2>
              </div>
              <p>{section.description}</p>
            </div>
            {typeof section.data.media === "string" && section.data.media ? (
              /^(https:\/\/)(www\.)?(youtube\.com|youtu\.be)\//.test(
                section.data.media,
              ) ? (
                <ExternalVideo url={section.data.media} title={section.title} />
              ) : (
                <ProductVideo src={section.data.media} title={section.title} />
              )
            ) : (
              <div className="empty">
                {ui(
                  "page_neue_produktvideos_werden_hier_veroffentlicht_soba_24",
                )}
              </div>
            )}
          </section>
        );
      case "testimonials":
        return testimonials.length ? (
          <section className="section container" key={section.id}>
            <h2>{ui("page_stimmen_aus_dem_alltag__25")}</h2>
            <div className="card-grid">
              {testimonials
                .filter((v) => v.data.approved)
                .map((v) => (
                  <blockquote key={v.id}>
                    <p>{v.description}</p>
                    <cite>
                      {v.title}
                      {ui("page___26")}
                      {String(v.data.source || "")}
                    </cite>
                  </blockquote>
                ))}
            </div>
          </section>
        ) : null;
      case "news":
        return (
          <section className="section soft-section" key={section.id}>
            <div className="container">
              <div className="section-head">
                <div>
                  <span className="eyebrow">
                    {ui("page_wir_entwickeln_weiter_27")}
                  </span>
                  <h2>{section.title}</h2>
                </div>
                <div className="development-actions">
                  <Link className="button secondary" href="/developers">
                    {ui("page_zum_developer_hub_28")}
                    <ArrowRight size={18} />
                  </Link>
                  <Link className="button" href="/developers/feedback#polls">
                    Zu den Abstimmungen <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
              {news.length ? (
                <div className="card-grid">
                  {news.slice(0, 3).map((n) => (
                    <Link
                      className="card"
                      key={n.id}
                      href={`/developers/news/${n.slug}`}
                    >
                      <span className="pill">
                        {n.category || copy("news_69752f")}
                      </span>
                      <h3>{n.title}</h3>
                      <p>{n.description}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p>{section.description}</p>
              )}
            </div>
          </section>
        );
      case "social":
        return (
          <section className="section container" key={section.id}>
            <div className="social-block">
              <div>
                <span className="eyebrow">
                  {ui("page_auch_zwischen_den_updates_29")}
                </span>
                <h2>{section.title}</h2>
                <p>{section.description}</p>
              </div>
              <div className="social-links">
                {s.instagram && (
                  <SocialLink href={s.instagram}>
                    {ui("page_instagram_30")}
                  </SocialLink>
                )}
                {s.facebook && (
                  <SocialLink href={s.facebook}>
                    {ui("page_facebook_31")}
                  </SocialLink>
                )}
                {s.tiktok && (
                  <SocialLink href={s.tiktok}>
                    {ui("page_tiktok_32")}
                  </SocialLink>
                )}
              </div>
            </div>
            {instagramPost && <ExternalPost url={instagramPost} />}
          </section>
        );
      case "faq":
        return (
          <section
            className="section container faq-layout"
            id="faq"
            key={section.id}
          >
            <div>
              <span className="eyebrow">{ui("page_gut_zu_wissen_33")}</span>
              <h2>{section.title}</h2>
              <p>{section.description}</p>
              <Link href="/developers/feedback" className="button secondary">
                {ui("page_frag_uns_34")}
                <ArrowUpRight size={18} />
              </Link>
            </div>
            <div>
              {faqs.map((f) => (
                <Faq key={f.id} title={f.title} description={f.description} />
              ))}
            </div>
          </section>
        );
      case "download":
        return (
          <section className="section container" key={section.id}>
            <div className="download-banner">
              <div>
                <h2>{section.title}</h2>
                <p>{section.description}</p>
                <StoreButtons settings={s} />
              </div>
              <Link className="button" href="/downloads">
                {ui("page_alle_download_infos_35")}
                <ArrowRight size={18} />
              </Link>
            </div>
          </section>
        );
      default:
        return null;
    }
  };
  return (
    <>
      {(() => {
        const ordered = sections.filter(
          (s) => !["videos", "news"].includes(String(s.data.section)),
        );
        const index = ordered.findIndex((s) => s.data.section === "demo");
        ordered.splice(
          index < 0 ? ordered.length : index,
          0,
          ...["videos", "news"].flatMap((type) =>
            sections.filter((s) => s.data.section === type),
          ),
        );
        return ordered.map(show);
      })()}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: copy("sproutly_60e4dc"),
            url: siteUrl(),
            inLanguage: "de-CH",
          }).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}
