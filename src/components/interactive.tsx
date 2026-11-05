"use client";
import { copy } from "@/lib/ui-extra";

import { ui } from "@/lib/ui-text";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  Menu,
  X,
  Plus,
  ArrowUp,
  Play,
  ShieldCheck,
} from "lucide-react";
import { categories, preferredStore } from "@/lib/browser";
import type { Settings } from "@/lib/model";
import { t } from "@/lib/i18n";
export function track(event: string) {
  try {
    const c = JSON.parse(localStorage.getItem("sproutly-consent") || "{}");
    if (c.statistics)
      void fetch("/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ consent: true, event, path: location.pathname }),
      }).catch(() => {});
  } catch {}
}
export function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="mobile-toggle"
        aria-label={
          open ? copy("menu_schliessen_55d49f") : copy("menu_offnen_ac3b2e")
        }
        aria-expanded={open}
        aria-controls="main-nav"
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
      <nav id="main-nav" className={open ? "main-nav open" : "main-nav"}>
        {Object.entries(t.nav).map(([key, label]) => (
          <Link
            onClick={() => setOpen(false)}
            key={key}
            className={key === "download" ? "button small" : ""}
            href={
              key === "developers"
                ? "/developers"
                : key === "download"
                  ? "/downloads"
                  : `/#${key}`
            }
          >
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
export function StoreButtons({ settings: s }: { settings: Settings }) {
  const preferred = useSyncExternalStore(
    () => () => {},
    () => preferredStore(navigator.userAgent),
    () => null,
  );
  return (
    <div className="store-buttons">
      {(["apple", "google"] as const).map((store) => {
        const badge = (
          <Image
            className={`store-badge ${store}`}
            src={
              store === "apple"
                ? "/images/stores/app-store.svg"
                : "/images/stores/google-play.png"
            }
            alt={
              store === "apple" ? "Laden im App Store" : "Jetzt bei Google Play"
            }
            width={store === "apple" ? 150 : 180}
            height={store === "apple" ? 50 : 70}
            unoptimized
          />
        );
        return (
          <div className="store-item" key={store}>
            {s[store] ? (
              <a
                href={s[store]}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track(`download_${store}`)}
              >
                {badge}
              </a>
            ) : (
              <span aria-disabled="true">{badge}</span>
            )}
            <small>
              {s[store]
                ? preferred === store
                  ? "Für dein Gerät empfohlen"
                  : ""
                : "Veröffentlichung ausstehend"}
            </small>
          </div>
        );
      })}
    </div>
  );
}

export function Demo() {
  const [text, setText] = useState<string>(
    copy("wochenende_mit_freunden_planen_ad1822"),
  );
  const [task, setTask] = useState("");
  const [project, setProject] = useState<string>(copy("personlich_9da981"));
  return (
    <div className="demo">
      <div className="demo-head">
        <span className="pill">{ui("interactive_interaktive_demo_1")}</span>
        <small>
          {ui("interactive_nur_beispieldaten_wird_nicht_gespeichert_2")}
        </small>
      </div>
      <h3>{ui("interactive_ein_gedanke_wird_ein_plan__3")}</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) setTask(text.trim());
        }}
      >
        <label htmlFor="demo-task">
          {ui("interactive_was_mochtest_du_festhalten__4")}
        </label>
        <div className="input-row">
          <input
            id="demo-task"
            maxLength={80}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            className="button"
            aria-label={copy("aufgabe_hinzufugen_cf9c1a")}
          >
            <Plus size={20} />
          </button>
        </div>
        <label htmlFor="demo-project">{ui("interactive_projekt_5")}</label>
        <select
          id="demo-project"
          value={project}
          onChange={(e) => setProject(e.target.value)}
        >
          <option>{ui("interactive_personlich_6")}</option>
          <option>{ui("interactive_wochenendplane_7")}</option>
          <option>{ui("interactive_ideensammlung_8")}</option>
        </select>
      </form>
      {task && (
        <div className="demo-result" aria-live="polite">
          <Check />
          <div>
            <strong>{task}</strong>
            <small>
              {ui("interactive_dein_demo_dashboard__9")}
              {project}
            </small>
          </div>
          <button
            aria-label={copy("demo_aufgabe_entfernen_98b88e")}
            onClick={() => setTask("")}
          >
            <X size={18} />
          </button>
        </div>
      )}
      <p className="fine">
        {ui(
          "interactive_so_konnte_sich_organisieren_anfuhlen_die_demo_illu_10",
        )}
      </p>
    </div>
  );
}
export function FeedbackForm({ enabled }: { enabled: boolean }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [startedAt] = useState(() => Date.now());
  return (
    <form
      className="feedback-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const form = e.currentTarget;
        const data = Object.fromEntries(new FormData(form));
        try {
          const res = await fetch("/api/feedback", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ ...data, startedAt }),
          });
          const result = await res.json();
          setMessage(res.ok ? t.feedback.success : result.error);
          if (res.ok) {
            form.reset();
            track("feedback");
          }
        } catch {
          setMessage(t.common.error);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        {ui("interactive_titel_11")}
        <small>{ui("interactive_max_80_zeichen_12")}</small>
        <input name="title" required minLength={3} maxLength={80} />
      </label>
      <label>
        {ui("interactive_beschreibung_13")}
        <small>{ui("interactive_max_500_zeichen_14")}</small>
        <textarea
          name="description"
          required
          minLength={10}
          maxLength={500}
          rows={5}
        />
      </label>
      <label>
        {ui("interactive_kategorie_15")}
        <select name="category">
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label>
        {t.feedback.email}
        <input type="email" name="email" maxLength={254} />
      </label>
      <label className="honeypot" aria-hidden="true">
        {ui("interactive_website_16")}
        <input tabIndex={-1} autoComplete="off" name="website" />
      </label>
      <p className="fine">
        {t.feedback.privacy}{" "}
        <Link href="/datenschutz">
          {ui("interactive_datenschutzhinweise_17")}
        </Link>
      </p>
      <button className="button" disabled={busy || !enabled}>
        {busy ? copy("wird_gesendet__e2308a") : t.feedback.submit}
        <ArrowRight size={18} />
      </button>
      {!enabled && (
        <p className="notice">
          {ui(
            "interactive_feedback_wird_freigeschaltet_sobald_die_separate_d_18",
          )}
        </p>
      )}
      <p role="status">{message}</p>
    </form>
  );
}
export function Vote({ id, count }: { id: string; count: number }) {
  const [votes, setVotes] = useState(count);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <div>
      <button
        className="vote"
        disabled={done}
        onClick={async () => {
          setDone(true);
          try {
            const res = await fetch("/api/feedback/vote", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ id }),
            });
            const data = await res.json();
            if (data.added) setVotes((v) => v + 1);
            setMessage(data.message || data.error);
            if (!res.ok) setDone(false);
          } catch {
            setMessage(t.common.error);
            setDone(false);
          }
        }}
        aria-label={`Vorschlag unterstützen, ${votes} Stimmen`}
      >
        <ArrowUp size={18} />
        {votes}
      </button>
      <small role="status">{message}</small>
    </div>
  );
}
export function Faq({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <details
      onToggle={(e) => {
        if (e.currentTarget.open) track("faq");
      }}
    >
      <summary>
        {title}
        <Plus size={18} />
      </summary>
      <p>{description}</p>
    </details>
  );
}
export function SocialLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("social")}
    >
      {children}
      <ArrowRight size={16} />
    </a>
  );
}
export function Consent({ analyticsEnabled }: { analyticsEnabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [statistics, setStatistics] = useState(false);
  const [external, setExternal] = useState(false);
  const path = usePathname();
  useEffect(() => {
    const hydrate = () => {
      try {
        const c = JSON.parse(localStorage.getItem("sproutly-consent") || "{}");
        setStatistics(Boolean(c.statistics));
        setExternal(Boolean(c.external));
        if (analyticsEnabled && !c.version) setOpen(true);
      } catch {}
    };
    const frame = requestAnimationFrame(hydrate);
    return () => cancelAnimationFrame(frame);
  }, [analyticsEnabled]);
  useEffect(() => {
    if (analyticsEnabled)
      track(
        path === "/downloads" && location.search.includes("source=")
          ? "qr"
          : "pageview",
      );
  }, [path, analyticsEnabled]);
  function save(stats: boolean, ext: boolean) {
    setStatistics(stats);
    setExternal(ext);
    localStorage.setItem(
      "sproutly-consent",
      JSON.stringify({
        version: 1,
        statistics: stats,
        external: ext,
        date: new Date().toISOString(),
      }),
    );
    window.dispatchEvent(new Event("sproutly-consent"));
    setOpen(false);
  }
  return (
    <>
      <button className="text-button" onClick={() => setOpen(true)}>
        {ui("interactive_datenschutzeinstellungen_19")}
      </button>
      {open && (
        <div
          className="consent-panel"
          role="region"
          aria-label={copy("datenschutzeinstellungen_ae0a01")}
        >
          <ShieldCheck />
          <h2>{ui("interactive_du_entscheidest__20")}</h2>
          <p>
            {ui(
              "interactive_notwendige_funktionen_sind_immer_aktiv_statistik_u_21",
            )}
          </p>
          <label className="check-label">
            <input
              type="checkbox"
              checked={statistics}
              disabled={!analyticsEnabled}
              onChange={(e) => setStatistics(e.target.checked)}
            />
            {ui("interactive_statistik_22")}
            {!analyticsEnabled && " (derzeit deaktiviert)"}
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={external}
              onChange={(e) => setExternal(e.target.checked)}
            />
            {ui("interactive_externe_medien_23")}
          </label>
          <div className="actions">
            <button
              className="button secondary"
              onClick={() => save(false, false)}
            >
              {ui("interactive_nur_notwendig_24")}
            </button>
            <button
              className="button secondary"
              onClick={() => save(statistics, external)}
            >
              {ui("interactive_auswahl_speichern_25")}
            </button>
            <button className="text-button" onClick={() => setOpen(false)}>
              {ui("interactive_schliessen_26")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
export function ExternalPost({ url }: { url: string }) {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    const update = () => {
      try {
        setAllowed(
          Boolean(
            JSON.parse(localStorage.getItem("sproutly-consent") || "{}")
              .external,
          ),
        );
      } catch {
        setAllowed(false);
      }
    };
    update();
    window.addEventListener("sproutly-consent", update);
    return () => window.removeEventListener("sproutly-consent", update);
  }, []);
  if (!/^https:\/\/www\.instagram\.com\/(p|reel)\/[\w-]+\/?$/.test(url))
    return null;
  return allowed ? (
    <iframe
      className="instagram-frame"
      title={copy("sproutly_auf_instagram_8f3416")}
      loading="lazy"
      src={`${url.replace(/\/$/, "")}/embed/`}
      sandbox="allow-scripts allow-same-origin allow-popups"
    />
  ) : (
    <div className="empty">
      <p>
        {ui(
          "interactive_instagram_inhalt_laden_dabei_wird_eine_verbindung__27",
        )}
      </p>
      <button className="button secondary" onClick={() => setAllowed(true)}>
        {ui("interactive_diesen_beitrag_laden_28")}
      </button>
      <a href={url} rel="noreferrer" target="_blank">
        {ui("interactive_auf_instagram_ansehen_29")}
      </a>
    </div>
  );
}
export function ProductVideo({
  src,
  poster,
  title,
}: {
  src: string;
  poster?: string;
  title: string;
}) {
  const [active, setActive] = useState(false);
  return active ? (
    <video
      className="product-video"
      controls
      preload="metadata"
      poster={poster}
      onPlay={() => track("video")}
    >
      <source src={src} type="video/mp4" />
      {ui("interactive_dein_browser_unterstutzt_die_videowiedergabe_nicht_30")}
    </video>
  ) : (
    <button className="video-placeholder" onClick={() => setActive(true)}>
      <Play />
      <span>{title}</span>
      <small>{ui("interactive_video_laden_und_ansehen_31")}</small>
    </button>
  );
}

export function ExternalVideo({ url, title }: { url: string; title: string }) {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    const update = () => {
      try {
        setAllowed(
          Boolean(
            JSON.parse(localStorage.getItem("sproutly-consent") || "{}")
              .external,
          ),
        );
      } catch {
        setAllowed(false);
      }
    };
    update();
    window.addEventListener("sproutly-consent", update);
    return () => window.removeEventListener("sproutly-consent", update);
  }, []);
  let id = "";
  try {
    const u = new URL(url);
    if (["www.youtube.com", "youtube.com"].includes(u.hostname))
      id = u.searchParams.get("v") || "";
    if (u.hostname === "youtu.be") id = u.pathname.slice(1);
  } catch {}
  if (!/^[\w-]{11}$/.test(id))
    return (
      <p className="notice">
        Dieses externe Videoformat ist noch nicht unterstützt.
      </p>
    );
  return allowed ? (
    <iframe
      className="external-video"
      title={title}
      src={`https://www.youtube-nocookie.com/embed/${id}`}
      allow="fullscreen"
      loading="lazy"
      sandbox="allow-scripts allow-same-origin allow-presentation"
    />
  ) : (
    <div className="empty">
      <p>
        Dieses Video wird von YouTube bereitgestellt. Beim Laden wird eine
        Verbindung zum Anbieter hergestellt.
      </p>
      <button
        className="button secondary"
        onClick={() => {
          setAllowed(true);
          track("video");
        }}
      >
        Video laden
      </button>
    </div>
  );
}
