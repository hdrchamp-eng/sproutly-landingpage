# Sproutly – öffentliche App-Website

Öffentliche Testvorschau: https://hdrchamp-eng.github.io/sproutly-landingpage/

Die Oberfläche ist ohne Anmeldung nutzbar. Diese GitHub-Pages-Version ist eine statische Vorschau: Landingpage, Demo, FAQ, Downloads und Developer-Hub-Seiten. Feedbackübermittlung, Upvotes, dynamische Daten und Analytics benötigen ein separates Backend und sind hier nicht angebunden. Es werden keine Store-Links oder Veröffentlichungen erfunden.

## Entwicklung

Node.js 24 und pnpm 11: `pnpm install --frozen-lockfile`, danach `pnpm dev`.

## Statische Vorschau bauen

`node scripts/build-pages.mjs` erstellt einen isolierten Export unter `.local/pages-build/out`. Die Quelldateien der Next.js-Anwendung bleiben erhalten. Der Export enthält keine lokale Datenbankkonfiguration und keine privaten Schlüssel.

GitHub Actions veröffentlicht den Export über den Workflow `Publish Sproutly preview`. Beim initialen Upload wird das geprüfte Quellarchiv automatisch in normale Repository-Dateien entpackt.

Die rechtlichen Texte sind Entwürfe und müssen vor einem offiziellen Produktivstart vervollständigt werden. Die Vorschau bleibt für Suchmaschinen gesperrt.
