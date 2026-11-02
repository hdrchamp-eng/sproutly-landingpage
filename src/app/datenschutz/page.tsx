import { copy } from "@/lib/ui-extra";
import { ui } from "@/lib/ui-text";
export const revalidate = 60;
import { settings } from "@/lib/db";
export const metadata = {
  title: copy("datenschutz_f624fc"),
  robots: { index: false, follow: true },
};
export default async function Privacy() {
  const s = await settings();
  return (
    <div className="container">
      <div className="page-heading">
        <span className="eyebrow">{ui("page_transparenz_0")}</span>
        <h1>{ui("page_datenschutz_1")}</h1>
        {!s.legalVerified && (
          <p className="notice">
            {ui("page_entwurf_unternehmensangaben_rechtsgrundlagen_anbie_2")}
          </p>
        )}
      </div>
      <article className="prose">
        <h2>{ui("page_verantwortliche_stelle_3")}</h2>
        <p>
          {s.company ||
            copy("noch_zu_erganzen_rechtlicher_firmenname_und_r_6c1899")}
          <br />
          {s.address ||
            copy("noch_zu_erganzen_vollstandige_geschaftsadress_b3cbaa")}
          <br />
          {s.contact ||
            copy("noch_zu_erganzen_kontakt_fur_datenschutzanfra_62bbed")}
        </p>
        <h2>{ui("page_welche_daten_diese_website_verarbeitet_4")}</h2>
        <p>{ui("page_die_website_dient_zur_information_uber_sproutly_un_5")}</p>
        <h2>{ui("page_feedback_und_kontakt_6")}</h2>
        <p>{ui("page_titel_beschreibung_und_kategorie_werden_zur_prufun_7")}</p>
        <h2>{ui("page_aufbewahrung_und_loschung_8")}</h2>
        <p>
          {ui("page_die_konfigurierte_technische_frist_fur_kontaktadre_9")}{" "}
          {s.contactRetentionDays}{" "}
          {ui("page_tage_abgelehnte_erledigte_archivierte_und_als_spam_10")}{" "}
          {s.feedbackRetentionDays}{" "}
          {ui("page_tagen_seit_der_letzten_anderung_bereinigt_freigege_11")}{" "}
          {s.logRetentionDays}{" "}
          {ui("page_tagen_bereinigt_diese_fristen_sind_vor_produktivga_12")}
        </p>
        <h2>{ui("page_notwendige_speicherung_und_abstimmungen_13")}</h2>
        <p>
          {ui("page_bei_einer_abstimmung_wird_ein_zufalliger_abstimmun_14")}
        </p>
        <h2>{ui("page_statistik_15")}</h2>
        <p>
          {s.analyticsEnabled
            ? copy("die_optionale_statistik_ist_konfiguriert__c38a5b")
            : copy("die_optionale_statistik_ist_derzeit_deaktivie_def043")}{" "}
          {ui("page_erst_nach_einwilligung_werden_ereignisse_wie_seite_16")}
        </p>
        <h2>{ui("page_externe_medien_und_soziale_netzwerke_17")}</h2>
        <p>
          {ui("page_social_media_links_laden_beim_blossen_seitenaufruf_18")}
        </p>
        <h2>{ui("page_administration_und_dienstleister_19")}</h2>
        <p>
          {ui("page_fur_berechtigte_mitarbeitende_wird_supabase_auth_m_20")}
        </p>
        <h2>{ui("page_rechtsgrundlagen_ubermittlungen_und_rechte_21")}</h2>
        <p>
          {ui("page_die_fur_den_tatsachlichen_betrieb_einschlagigen_gr_22")}
        </p>
      </article>
    </div>
  );
}
