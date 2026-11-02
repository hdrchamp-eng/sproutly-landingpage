"use client";
import { copy } from "@/lib/ui-extra";

import { ui } from "@/lib/ui-text";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  type Entry,
  type Resource,
  type Settings,
  type Block,
  categories,
  moderationStatuses,
  roadStatuses,
} from "@/lib/model";
export async function request(url: string, value: unknown, method = "POST") {
  const res = await fetch(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(value),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.error || copy("speichern_nicht_moglich__553bce"));
  return data;
}
export function Logout() {
  const router = useRouter();
  return (
    <button
      className="text-button"
      onClick={async () => {
        await request("/api/auth/logout", {});
        router.push("/admin/login");
        router.refresh();
      }}
    >
      {ui("admin_abmelden_0")}
    </button>
  );
}
export function Login({
  enabled,
  factorId,
  needsMfa,
}: {
  enabled: boolean;
  factorId?: string;
  needsMfa?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [factor, setFactor] = useState(factorId || "");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  return (
    <div className="admin-login card">
      <span className="eyebrow">{ui("admin_sproutly_administration_1")}</span>
      <h1>
        {needsMfa
          ? copy("ein_zweiter_schutz__75ae07")
          : copy("willkommen_zuruck__6932a8")}
      </h1>
      <p>
        {needsMfa
          ? copy("bestatige_deine_anmeldung_mit_der_authenticat_1c97da")
          : copy("melde_dich_mit_deinem_freigeschalteten_konto__3a7a93")}
      </p>
      {!enabled && (
        <p className="notice">
          {ui("admin_die_separate_supabase_umgebung_ist_noch_nicht_eing_2")}
        </p>
      )}
      {needsMfa && !factor && (
        <button
          className="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              const d = await request("/api/auth/enroll", {});
              setFactor(d.factorId);
              setQr(d.qr);
              setSecret(d.secret);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {ui("admin_authenticator_einrichten_3")}
        </button>
      )}
      {qr && (
        <>
          <Image
            src={qr}
            width={220}
            height={220}
            unoptimized
            alt={copy("qr_code_fur_deine_authenticator_app_32e5d9")}
          />
          <p className="fine">
            {ui("admin_alternativ_diesen_schlussel_in_deiner_authenticato_4")}
          </p>
          <code style={{ overflowWrap: "anywhere" }}>{secret}</code>
        </>
      )}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const data = Object.fromEntries(new FormData(e.currentTarget));
            await request(
              `/api/auth/${needsMfa ? "verify" : "login"}`,
              needsMfa ? { factorId: factor, code: data.code } : data,
            );
            router.push("/admin/dashboard");
            router.refresh();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {needsMfa ? (
          <label>
            {ui("admin_sechsstelliger_code_5")}
            <input
              name="code"
              required
              pattern="[0-9]{6}"
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
            />
          </label>
        ) : (
          <>
            <label>
              {ui("admin_e_mail_6")}
              <input
                name="email"
                type="email"
                autoComplete="username"
                required
              />
            </label>
            <label>
              {ui("admin_passwort_7")}
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
          </>
        )}
        <button
          className="button"
          style={{ marginTop: 20 }}
          disabled={!enabled || busy || (needsMfa && !factor)}
        >
          {busy
            ? copy("bitte_warten__ad4c7b")
            : needsMfa
              ? copy("bestatigen_15b63b")
              : copy("anmelden_a329a3")}
        </button>
        <p role="alert">{error}</p>
      </form>
      {needsMfa && <Logout />}
    </div>
  );
}
const fresh = (): Entry => ({
  id: "",
  title: "",
  description: "",
  status: "draft",
  slug: null,
  category: "",
  position: 0,
  visible: true,
  locale: "de",
  data: {},
  published_at: null,
  created_at: "",
  updated_at: "",
});
export function ContentManager({
  resource,
  initial,
}: {
  resource: Resource;
  initial: Entry[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [item, setItem] = useState<Entry | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState<number | null>(null);
  function patch(key: keyof Entry, value: unknown) {
    setItem((i) => (i ? { ...i, [key]: value } : i));
  }
  function data(key: string, value: unknown) {
    setItem((i) => (i ? { ...i, data: { ...i.data, [key]: value } } : i));
  }
  async function persist(value: Entry) {
    const { id, created_at, updated_at, ...payload } = value;
    void created_at;
    void updated_at;
    return request(`/api/admin/${resource}`, {
      operation: "save",
      ...(id ? { id } : {}),
      value: payload,
    });
  }
  async function reorder(from: number, to: number) {
    if (to < 0 || to >= rows.length || from === to) return;
    setBusy(true);
    setMessage("");
    const next = [...rows];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    try {
      for (let i = 0; i < next.length; i++)
        if (next[i].position !== i) {
          next[i] = { ...next[i], position: i };
          await persist(next[i]);
        }
      setRows(next);
      setMessage(copy("reihenfolge_gespeichert__421015"));
      router.refresh();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const blocks = (item?.data.blocks || []) as Block[];
  return (
    <div>
      <button
        className="button"
        onClick={() => {
          setItem(fresh());
          setMessage("");
        }}
      >
        <Plus size={18} />
        {ui("admin_neuen_eintrag_erstellen_8")}
      </button>
      <p role="status">{message}</p>
      <div className="admin-list">
        {rows.map((row, i) => (
          <div
            className="admin-row"
            key={row.id}
            draggable={!busy}
            onDragStart={() => setDrag(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (drag !== null) void reorder(drag, i);
              setDrag(null);
            }}
          >
            <div className="grow">
              <strong>{row.title}</strong>
              <small>
                {row.status}
                {ui("admin___9")}
                {row.visible ? "sichtbar" : "deaktiviert"}
                {ui("admin___10")} {row.locale.toUpperCase()}
              </small>
            </div>
            <button
              aria-label={`${row.title} nach oben`}
              disabled={busy || i === 0}
              onClick={() => reorder(i, i - 1)}
            >
              <ArrowUp size={16} />
            </button>
            <button
              aria-label={`${row.title} nach unten`}
              disabled={busy || i === rows.length - 1}
              onClick={() => reorder(i, i + 1)}
            >
              <ArrowDown size={16} />
            </button>
            {resource === "developer_news" && row.id && (
              <Link href={`/admin/preview/${row.id}`}>{ui("news_preview_open")}</Link>
            )}
            <button onClick={() => setItem(row)}>
              {ui("admin_bearbeiten_11")}
            </button>
          </div>
        ))}
      </div>
      {item && (
        <form
          className="editor admin-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await persist(item);
              setMessage(copy("gespeichert__7f0867"));
              setItem(null);
              router.refresh();
              location.reload();
            } catch (e) {
              setMessage((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <h2>
            {item.id
              ? copy("eintrag_bearbeiten_b32de8")
              : copy("neuer_eintrag_c325ef")}
          </h2>
          <label>
            {ui("admin_titel_12")}
            <input
              required
              maxLength={150}
              value={item.title}
              onChange={(e) => patch("title", e.target.value)}
            />
          </label>
          <label>
            {ui("admin_beschreibung_antwort_13")}
            <textarea
              maxLength={2000}
              rows={4}
              value={item.description}
              onChange={(e) => patch("description", e.target.value)}
            />
          </label>
          <div className="form-grid">
            <label>
              {ui("admin_status_14")}
              <select
                value={item.status}
                onChange={(e) => patch("status", e.target.value)}
              >
                {(resource === "roadmap_items"
                  ? ["draft", ...roadStatuses, "archived"]
                  : ["draft", "published", "archived"]
                ).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              {ui("admin_kategorie_15")}
              <input
                maxLength={80}
                value={item.category}
                onChange={(e) => patch("category", e.target.value)}
              />
            </label>
            <label>
              {ui("admin_url_slug_16")}
              <input
                maxLength={120}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                value={item.slug || ""}
                onChange={(e) => patch("slug", e.target.value || null)}
              />
            </label>
            <label>
              {ui("admin_sprache_17")}
              <select
                value={item.locale}
                onChange={(e) => patch("locale", e.target.value)}
              >
                <option value="de">{ui("admin_deutsch_18")}</option>
                <option value="en">
                  {ui("admin_englisch_vorbereitet_noch_nicht_offentlich__19")}
                </option>
              </select>
            </label>
            <label>
              {ui("admin_veroffentlichungszeit_20")}
              <input
                type="datetime-local"
                value={
                  item.published_at
                    ? new Date(
                        new Date(item.published_at).getTime() -
                          new Date(item.published_at).getTimezoneOffset() *
                            60000,
                      )
                        .toISOString()
                        .slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  patch(
                    "published_at",
                    e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null,
                  )
                }
              />
            </label>
            <label>
              {ui("admin_position_21")}
              <input
                type="number"
                min={0}
                max={10000}
                value={item.position}
                onChange={(e) => patch("position", Number(e.target.value))}
              />
            </label>
          </div>
          <label className="check-label">
            <input
              type="checkbox"
              checked={item.visible}
              onChange={(e) => patch("visible", e.target.checked)}
            />
            {ui("admin_eintrag_aktiv_22")}
          </label>
          {resource === "page_sections" && (
            <div className="form-grid">
              <label>
                {ui("admin_abschnitt_23")}
                <select
                  value={String(item.data.section || "")}
                  onChange={(e) => data("section", e.target.value)}
                >
                  <option value="">{ui("admin_bitte_wahlen_24")}</option>
                  {[
                    "hero",
                    "features",
                    "how",
                    "demo",
                    "videos",
                    "testimonials",
                    "news",
                    "social",
                    "faq",
                    "download",
                  ].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
              <label>
                {ui("admin_hintergrund_25")}
                <select
                  value={String(item.data.background || "cream")}
                  onChange={(e) => data("background", e.target.value)}
                >
                  <option>{ui("admin_cream_26")}</option>
                  <option>{ui("admin_lilac_27")}</option>
                  <option>{ui("admin_mint_28")}</option>
                </select>
              </label>
            </div>
          )}
          {resource === "feature_cards" && (
            <label>
              {ui("admin_icon_29")}
              <select
                value={String(item.data.icon || "sparkles")}
                onChange={(e) => data("icon", e.target.value)}
              >
                {["sparkles", "check", "notes", "folder", "mic", "grid"].map(
                  (v) => (
                    <option key={v}>{v}</option>
                  ),
                )}
              </select>
            </label>
          )}
          <label>
            {ui("admin_medien_url_aus_der_medienbibliothek_30")}
            <input
              value={String(item.data.media || "")}
              onChange={(e) => data("media", e.target.value)}
            />
          </label>
          <label>
            {ui("admin_alternativtext_31")}
            <input
              maxLength={300}
              value={String(item.data.alt || "")}
              onChange={(e) => data("alt", e.target.value)}
            />
          </label>
          {resource === "testimonials" && (
            <>
              <label>
                {ui("admin_dokumentierte_herkunft_32")}
                <input
                  required
                  value={String(item.data.source || "")}
                  onChange={(e) => data("source", e.target.value)}
                />
              </label>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={Boolean(item.data.approved)}
                  onChange={(e) => data("approved", e.target.checked)}
                />
                {ui("admin_echtheit_und_veroffentlichungsfreigabe_gepruft_33")}
              </label>
            </>
          )}
          {resource === "roadmap_items" && (
            <label>
              {ui("admin_geplanter_zeitraum_optional__34")}
              <input
                value={String(item.data.period || "")}
                onChange={(e) => data("period", e.target.value)}
              />
            </label>
          )}
          {resource === "releases" && (
            <>
              <div className="form-grid">
                <label>
                  {ui("admin_version_35")}
                  <input
                    required
                    maxLength={40}
                    value={String(item.data.version || "")}
                    onChange={(e) => data("version", e.target.value)}
                  />
                </label>
                <label>
                  {ui("admin_plattform_36")}
                  <select
                    value={String(item.data.platform || "")}
                    onChange={(e) => data("platform", e.target.value)}
                    required
                  >
                    <option value="">{ui("admin_bitte_wahlen_37")}</option>
                    <option>{ui("admin_ios_38")}</option>
                    <option>{ui("admin_android_39")}</option>
                    <option>{ui("admin_alle_40")}</option>
                  </select>
                </label>
              </div>
              <label>
                {ui(
                  "admin_anderungen_eine_zeile_pro_anderung_z_b_fixed_besch_41",
                )}
                <textarea
                  rows={8}
                  value={(
                    (item.data.changes || []) as {
                      category: string;
                      text: string;
                    }[]
                  )
                    .map((c) => `${c.category}: ${c.text}`)
                    .join("\n")}
                  onChange={(e) =>
                    data(
                      "changes",
                      e.target.value.split("\n").map((line) => {
                        const split = line.indexOf(":");
                        return {
                          category:
                            split < 0
                              ? copy("added_6b02e0")
                              : line.slice(0, split),
                          text:
                            split < 0
                              ? line
                              : line.slice(split + 1).trimStart(),
                        };
                      }),
                    )
                  }
                />
              </label>
              <p className="fine">
                {ui(
                  "admin_kategorien_added_improved_fixed_removed_security_k_42",
                )}
              </p>
            </>
          )}
          {resource === "developer_news" && (
            <>
              <h2>{ui("admin_inhalt_43")}</h2>
              {blocks.map((block, i) => (
                <div className="block-editor" key={i}>
                  <div className="block-actions">
                    <select
                      aria-label={`Block ${i + 1} Typ`}
                      value={block.type}
                      onChange={(e) =>
                        data(
                          "blocks",
                          blocks.map((b, j) =>
                            j === i ? { ...b, type: e.target.value } : b,
                          ),
                        )
                      }
                    >
                      {["paragraph", "heading", "list", "link", "image"].map(
                        (v) => (
                          <option key={v}>{v}</option>
                        ),
                      )}
                    </select>
                    <button
                      type="button"
                      aria-label={`Block ${i + 1} entfernen`}
                      className="button secondary"
                      onClick={() =>
                        data(
                          "blocks",
                          blocks.filter((_, j) => i !== j),
                        )
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <label>
                    {ui("admin_text_44")}{" "}
                    {block.type === "list"
                      ? copy("_ein_punkt_pro_zeile__d17121")
                      : block.type === "image"
                        ? copy("_alternativtext__222f5b")
                        : ""}
                    <textarea
                      value={block.text}
                      onChange={(e) =>
                        data(
                          "blocks",
                          blocks.map((b, j) =>
                            j === i ? { ...b, text: e.target.value } : b,
                          ),
                        )
                      }
                    />
                  </label>
                  {["link", "image"].includes(block.type) && (
                    <label>
                      {ui("admin_url_45")}
                      <input
                        value={block.url || ""}
                        onChange={(e) =>
                          data(
                            "blocks",
                            blocks.map((b, j) =>
                              j === i ? { ...b, url: e.target.value } : b,
                            ),
                          )
                        }
                      />
                    </label>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="button secondary"
                onClick={() =>
                  data("blocks", [...blocks, { type: "paragraph", text: "" }])
                }
              >
                {ui("admin_absatz_hinzufugen_46")}
              </button>
            </>
          )}
          <details>
            <summary>{ui("admin_seo_einstellungen_47")}</summary>
            <label>
              {ui("admin_seo_titel_48")}
              <input
                maxLength={100}
                value={String(item.data.seoTitle || "")}
                onChange={(e) => data(copy("seotitle_212c80"), e.target.value)}
              />
            </label>
            <label>
              {ui("admin_meta_beschreibung_49")}
              <textarea
                maxLength={300}
                value={String(item.data.seoDescription || "")}
                onChange={(e) =>
                  data(copy("seodescription_f67ed0"), e.target.value)
                }
              />
            </label>
            <label>
              {ui("admin_social_sharing_bild_50")}
              <input
                value={String(item.data.socialImage || "")}
                onChange={(e) =>
                  data(copy("socialimage_39018a"), e.target.value)
                }
              />
            </label>
            <label className="check-label">
              <input
                type="checkbox"
                checked={item.data.indexable !== false}
                onChange={(e) => data("indexable", e.target.checked)}
              />
              {ui("admin_indexierung_erlauben_51")}
            </label>
          </details>
          <div className="actions" style={{ marginTop: 25 }}>
            <button className="button" disabled={busy}>
              {ui("admin_speichern_52")}
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => setItem(null)}
            >
              {ui("admin_abbrechen_53")}
            </button>
            {item.id && (
              <button
                type="button"
                className="text-button"
                disabled={busy}
                onClick={async () => {
                  if (
                    !confirm(copy("diesen_eintrag_endgultig_loschen__87481d"))
                  )
                    return;
                  try {
                    await request(`/api/admin/${resource}`, {
                      operation: "delete",
                      id: item.id,
                    });
                    location.reload();
                  } catch (e) {
                    setMessage((e as Error).message);
                  }
                }}
              >
                {ui("admin_endgultig_loschen_54")}
              </button>
            )}
          </div>
          <p role="status">{message}</p>
        </form>
      )}
    </div>
  );
}
const settingLabels: Record<string, string> = {
  heroTitle: copy("hero_titel_979897"),
  heroSubtitle: copy("hero_untertitel_0abf97"),
  apple: copy("apple_app_store_url_aca40a"),
  google: copy("google_play_url_1f4f88"),
  instagram: copy("instagram_profil_ff656e"),
  facebook: copy("facebook_seite_9720e8"),
  tiktok: copy("tiktok_profil_ba9c1d"),
  instagramPost: copy("manueller_instagram_beitrag_a22057"),
  company: copy("firmenname_und_rechtsform_382b57"),
  address: copy("geschaftsadresse_7b68ff"),
  contact: copy("kontakt_e_mail_1fdaca"),
  seoTitle: copy("seo_titel_983911"),
  seoDescription: copy("meta_beschreibung_e82569"),
  feedbackRetentionDays: copy(
    "aufbewahrung_abgeschlossener_feedbackbeitrage_bbd7b4",
  ),
  contactRetentionDays: copy("aufbewahrung_von_kontaktadressen_tage__c51cea"),
  logRetentionDays: copy("aufbewahrung_von_audit_logs_tage__16c736"),
  analyticsEnabled: copy(
    "datensparsame_statistik_aktivieren_nur_mit_ei_dc2f48",
  ),
  legalVerified: copy("rechtliche_angaben_gepruft_und_freigegeben_cde2f2"),
  indexable: copy("suchmaschinenindexierung_aktivieren_0ca3e7"),
};
export function SettingsForm({ initial }: { initial: Settings }) {
  const [value, setValue] = useState(initial);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="admin-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await request("/api/admin/site_settings", {
            operation: "save",
            value,
          });
          setMessage(copy("einstellungen_gespeichert__9d2cc2"));
        } catch (e) {
          setMessage((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="notice">
        {ui("admin_nur_offentliche_angaben_eintragen_api_schlussel_ge_55")}
      </p>
      {Object.entries(value).map(([key, v]) =>
        typeof v === "boolean" ? (
          <label className="check-label" key={key}>
            <input
              type="checkbox"
              checked={v}
              onChange={(e) => setValue({ ...value, [key]: e.target.checked })}
            />
            {settingLabels[key]}
          </label>
        ) : (
          <label key={key}>
            {settingLabels[key] || key}
            {[
              copy("herosubtitle_c6b7e8"),
              "address",
              copy("seodescription_f67ed0"),
            ].includes(key) ? (
              <textarea
                value={String(v)}
                onChange={(e) => setValue({ ...value, [key]: e.target.value })}
              />
            ) : (
              <input
                type={typeof v === "number" ? "number" : "text"}
                value={v}
                onChange={(e) =>
                  setValue({
                    ...value,
                    [key]:
                      typeof v === "number"
                        ? Number(e.target.value)
                        : e.target.value,
                  })
                }
              />
            )}
          </label>
        ),
      )}
      <button className="button" disabled={busy}>
        {ui("admin_einstellungen_speichern_56")}
      </button>
      <p role="status">{message}</p>
    </form>
  );
}
export type ModerationEntry = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  internal_note: string;
  created_at: string;
};
export function Moderation({ initial }: { initial: ModerationEntry[] }) {
  const [filter, setFilter] = useState("");
  const [message, setMessage] = useState("");
  return (
    <>
      <label>
        {ui("admin_statusfilter_57")}
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">{ui("admin_alle_beitrage_58")}</option>
          {moderationStatuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <p role="status">{message}</p>
      {initial
        .filter((f) => !filter || f.status === filter)
        .map((f) => (
          <article className="card" key={f.id} style={{ marginTop: 20 }}>
            <span className="pill">{f.status}</span>
            <h2>{f.title}</h2>
            <p>{f.description}</p>
            <small>{f.created_at.slice(0, 10)}</small>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await request("/api/admin/feedback_submissions", {
                    operation: "save",
                    id: f.id,
                    value: Object.fromEntries(new FormData(e.currentTarget)),
                  });
                  location.reload();
                } catch (e) {
                  setMessage((e as Error).message);
                }
              }}
            >
              <div className="form-grid">
                <label>
                  {ui("admin_status_59")}
                  <select name="status" defaultValue={f.status}>
                    {moderationStatuses.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label>
                  {ui("admin_kategorie_60")}
                  <select name="category" defaultValue={f.category}>
                    {categories.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                {ui("admin_interne_notiz_niemals_offentlich__61")}
                <textarea
                  name="internal_note"
                  maxLength={2000}
                  defaultValue={f.internal_note}
                />
              </label>
              <button className="button secondary">
                {ui("admin_moderation_speichern_62")}
              </button>
            </form>
            {f.status === copy("freigegeben_ed0404") && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  try {
                    await request("/api/admin/feedback_submissions", {
                      operation: "reply",
                      id: f.id,
                      value: { response: new FormData(form).get("response") },
                    });
                    setMessage(copy("antwort_veroffentlicht__18f57b"));
                    form.reset();
                  } catch (e) {
                    setMessage((e as Error).message);
                  }
                }}
              >
                <label>
                  {ui("admin_offentliche_antwort_63")}
                  <textarea required maxLength={2000} name="response" />
                </label>
                <button className="button secondary">
                  {ui("admin_antwort_veroffentlichen_64")}
                </button>
              </form>
            )}
            <button
              className="text-button"
              onClick={async () => {
                if (
                  !confirm(
                    copy(
                      "beitrag_mit_kontaktdaten_stimmen_und_antworte_bb3273",
                    ),
                  )
                )
                  return;
                try {
                  await request("/api/admin/feedback_submissions", {
                    operation: "delete",
                    id: f.id,
                  });
                  location.reload();
                } catch (e) {
                  setMessage((e as Error).message);
                }
              }}
            >
              {ui("admin_beitrag_und_zugehorige_daten_loschen_65")}
            </button>
          </article>
        ))}
      {!initial.length && (
        <div className="empty">
          {ui("admin_noch_keine_feedbackbeitrage_eingegangen__66")}
        </div>
      )}
    </>
  );
}
export type Media = {
  id: string;
  path: string;
  mime: string;
  alt: string;
  size: number;
  used: boolean;
};
export function MediaManager({
  initial,
  baseUrl,
}: {
  initial: Media[];
  baseUrl: string;
}) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <p className="notice">
        {ui("admin_nur_zur_veroffentlichung_freigegebene_dateien_hoch_67")}
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            const res = await fetch("/api/admin/media", {
              method: "POST",
              body: new FormData(e.currentTarget),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            location.reload();
          } catch (e) {
            setMessage((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          {ui("admin_datei_68")}
          <input
            type="file"
            name="file"
            accept="image/png,image/jpeg,image/webp,video/mp4"
            required
          />
        </label>
        <label>
          {ui("admin_alternativtext_69")}
          <input name="alt" required maxLength={300} />
        </label>
        <button className="button" disabled={busy}>
          {busy ? copy("ladt_hoch__e50df5") : copy("hochladen_6638ef")}
        </button>
      </form>
      <p role="status">{message}</p>
      <div className="media-grid">
        {initial.map((m) => (
          <article key={m.id} className="card">
            {m.mime.startsWith("image") ? (
              <Image
                src={baseUrl + m.path}
                width={300}
                height={180}
                alt={m.alt}
                unoptimized
              />
            ) : (
              <video
                src={baseUrl + m.path}
                controls
                preload="none"
                aria-label={m.alt}
              />
            )}
            <small>
              {Math.round(m.size / 1024)}
              {ui("admin_kb__70")}{" "}
              {m.used
                ? copy("verwendet_554cbf")
                : copy("nicht_verwendet_f665c7")}
            </small>
            <code>{baseUrl + m.path}</code>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await request("/api/admin/media_assets", {
                    operation: "save",
                    id: m.id,
                    value: { alt: new FormData(e.currentTarget).get("alt") },
                  });
                  setMessage(copy("alternativtext_gespeichert__1e3a7f"));
                } catch (e) {
                  setMessage((e as Error).message);
                }
              }}
            >
              <label>
                {ui("admin_alternativtext_71")}
                <input
                  name="alt"
                  defaultValue={m.alt}
                  required
                  maxLength={300}
                />
              </label>
              <button className="text-button">
                {ui("admin_speichern_72")}
              </button>
            </form>
            <button
              className="text-button"
              disabled={m.used}
              onClick={async () => {
                if (!confirm(copy("datei_endgultig_loschen__2877d3"))) return;
                try {
                  await request("/api/admin/media", { id: m.id }, "DELETE");
                  location.reload();
                } catch (e) {
                  setMessage((e as Error).message);
                }
              }}
            >
              {ui("admin_datei_loschen_73")}
            </button>
          </article>
        ))}
      </div>
    </>
  );
}
