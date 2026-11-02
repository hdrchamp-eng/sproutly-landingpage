import { copy } from "@/lib/ui-extra";
import { ui } from "@/lib/ui-text";
export const revalidate = 60;
import { settings } from "@/lib/db";
export const metadata = {
  title: copy("impressum_b8a605"),
  robots: { index: false, follow: true },
};
export default async function Imprint() {
  const s = await settings();
  return (
    <div className="container">
      <div className="page-heading">
        <span className="eyebrow">{ui("page_rechtliche_informationen_0")}</span>
        <h1>{ui("page_impressum_1")}</h1>
      </div>
      <article className="prose">
        {!s.legalVerified && (
          <p className="notice">
            {ui("page_vor_veroffentlichung_zu_vervollstandigen_und_fur_u_2")}
          </p>
        )}
        <h2>{ui("page_unternehmen_3")}</h2>
        <p>
          {s.company ||
            copy("firmenname_und_rechtsform_noch_nicht_hinterle_0e7fc8")}
        </p>
        <h2>{ui("page_geschaftsadresse_4")}</h2>
        <p style={{ whiteSpace: "pre-line" }}>
          {s.address || copy("geschaftsadresse_noch_nicht_hinterlegt__67fe2a")}
        </p>
        <h2>{ui("page_kontakt_5")}</h2>
        <p>
          {s.contact ? (
            <a href={`mailto:${s.contact}`}>{s.contact}</a>
          ) : (
            copy("kontakt_e_mail_noch_nicht_hinterlegt__3fdbbe")
          )}
        </p>
        <h2>{ui("page_weitere_pflichtangaben_6")}</h2>
        <p>{ui("page_vertretungsberechtigte_personen_handelsregister_un_7")}</p>
      </article>
    </div>
  );
}
