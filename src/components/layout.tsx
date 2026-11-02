import { copy } from "@/lib/ui-extra";
import { ui } from "@/lib/ui-text";
import Image from "next/image";
import Link from "next/link";
import { Nav, Consent, SocialLink } from "./interactive";
import type { Settings } from "@/lib/model";
export function Brand() {
  return (
    <Link
      href="/"
      className="brand"
      aria-label={copy("sproutly_startseite_955095")}
    >
      <Image src="/brand/mark.png" alt="" width={45} height={45} />
      <span>{ui("layout_proutly_0")}</span>
    </Link>
  );
}
export function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Brand />
        <Nav />
      </div>
    </header>
  );
}
export function Footer({ settings: s }: { settings: Settings }) {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <Brand />
            <p>
              {ui("layout_dein_alltag_deine_gedanken__1")}
              <br />
              {ui("layout_mehr_raum_fur_das_was_dir_wichtig_ist__2")}
            </p>
          </div>
          <div className="footer-links">
            <div>
              <strong>{ui("layout_entdecken_3")}</strong>
              <Link href="/#features">{ui("layout_funktionen_4")}</Link>
              <Link href="/downloads">
                {ui("layout_app_store_google_play_5")}
              </Link>
              <Link href="/developers">{ui("layout_developer_hub_6")}</Link>
              <Link href="/#faq">{ui("layout_haufige_fragen_7")}</Link>
            </div>
            <div>
              <strong>{ui("layout_in_verbindung_bleiben_8")}</strong>
              {s.instagram && (
                <SocialLink href={s.instagram}>
                  {ui("layout_instagram_9")}
                </SocialLink>
              )}
              {s.facebook && (
                <SocialLink href={s.facebook}>
                  {ui("layout_facebook_10")}
                </SocialLink>
              )}
              {s.tiktok && (
                <SocialLink href={s.tiktok}>
                  {ui("layout_tiktok_11")}
                </SocialLink>
              )}
              {s.contact && (
                <a href={`mailto:${s.contact}`}>{ui("layout_kontakt_12")}</a>
              )}
            </div>
            <div>
              <strong>{ui("layout_gut_zu_wissen_13")}</strong>
              <Link href="/datenschutz">{ui("layout_datenschutz_14")}</Link>
              <Link href="/impressum">{ui("layout_impressum_15")}</Link>
              <Link href="/developers/feedback">
                {ui("layout_feedback_16")}
              </Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            {ui("layout___17")}
            {new Date().getFullYear()}
            {ui("layout_sproutly_18")}
          </span>
          <span>{ui("layout_mit_raum_fur_deinen_alltag__19")}</span>
          <Consent analyticsEnabled={s.analyticsEnabled} />
        </div>
      </div>
    </footer>
  );
}
