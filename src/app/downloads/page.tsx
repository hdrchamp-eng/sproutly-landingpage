import { copy } from "@/lib/ui-extra";
import { ui } from "@/lib/ui-text";
export const revalidate = 60;
import QRCode from "qrcode";
import Image from "next/image";
import { settings } from "@/lib/db";
import { StoreButtons } from "@/components/interactive";
import { siteUrl } from "@/lib/seo";
export const metadata = {
  title: copy("sproutly_herunterladen_84a5ac"),
  description: copy("alle_offiziellen_sproutly_downloads_und_qr_co_42854d"),
  alternates: { canonical: "/downloads" },
};
export default async function Downloads() {
  const s = await settings();
  const url = siteUrl();
  const configured = Boolean(process.env.NEXT_PUBLIC_SITE_URL);
  const qr = configured
    ? await QRCode.toDataURL(`${url}/downloads?source=website`, {
        margin: 2,
        width: 240,
        color: { dark: "#30232f", light: "#ffffff" },
      })
    : null;
  return (
    <div className="container">
      <div className="page-heading">
        <span className="eyebrow">{ui("page_dein_nachster_schritt_0")}</span>
        <h1>
          {ui("page_mehr_uberblick__1")}
          <br />
          {ui("page_bald_in_deiner_hand__2")}
        </h1>
        <p>
          {s.apple || s.google
            ? copy("wahle_deinen_store_und_entdecke_sproutly__ead6ff")
            : copy("die_veroffentlichung_wird_vorbereitet_hier_fi_874993")}
        </p>
      </div>
      <div className="downloads-layout">
        <div>
          <StoreButtons settings={s} />
          <p className="fine" style={{ marginTop: 20 }}>
            {ui("page_du_kannst_jederzeit_selbst_zwischen_den_stores_wah_3")}
          </p>
          {!s.apple && !s.google && (
            <p className="notice">
              {ui("page_es_ist_noch_kein_bestatigter_store_link_hinterlegt_4")}
            </p>
          )}
          {(["apple", "google"] as const).map(async (store) =>
            s[store] ? (
              <div key={store} className="qr">
                <Image
                  src={await QRCode.toDataURL(s[store], {
                    width: 200,
                    margin: 2,
                  })}
                  width={200}
                  height={200}
                  alt={`QR-Code für ${store === "apple" ? copy("app_store_c4424d") : copy("google_play_027b16")}`}
                />
                <p>
                  {store === "apple"
                    ? copy("app_store_c4424d")
                    : copy("google_play_027b16")}
                </p>
              </div>
            ) : null,
          )}
        </div>
        <div className="qr">
          {qr ? (
            <>
              <Image
                src={qr}
                width={240}
                height={240}
                alt={copy("qr_code_zur_sproutly_downloadseite_81c883")}
              />
              <h3>{ui("page_vom_bildschirm_aufs_handy__5")}</h3>
              <p>
                {ui(
                  "page_scanne_den_code_mit_deiner_kamera_und_wahle_deinen_6",
                )}
              </p>
            </>
          ) : (
            <>
              <Image
                src="/brand/icon.png"
                width={160}
                height={160}
                alt={copy("sproutly_app_icon_7cf47f")}
              />
              <h3>{ui("page_hier_wachst_dein_direkter_weg__7")}</h3>
              <p>
                {ui(
                  "page_der_download_qr_code_wird_aktiviert_sobald_die_off_8",
                )}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
