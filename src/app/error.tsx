"use client";
import { ui } from "@/lib/ui-text";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="container error-page">
      <h1>{ui("error_das_hat_gerade_nicht_geklappt__0")}</h1>
      <p>{ui("error_bitte_lade_die_seite_erneut__1")}</p>
      <button className="button" onClick={reset}>
        {ui("error_erneut_versuchen_2")}
      </button>
    </div>
  );
}
