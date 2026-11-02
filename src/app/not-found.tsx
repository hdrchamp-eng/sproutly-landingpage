import { ui } from "@/lib/ui-text";
import Link from "next/link";
export default function NotFound() {
  return (
    <div className="container error-page">
      <span className="eyebrow">{ui("not-found_404_0")}</span>
      <h1>{ui("not-found_hier_ist_gerade_nichts__1")}</h1>
      <p>
        {ui("not-found_vielleicht_wurde_die_seite_verschoben_oder_noch_ni_2")}
      </p>
      <Link className="button" href="/">
        {ui("not-found_zur_startseite_3")}
      </Link>
    </div>
  );
}
