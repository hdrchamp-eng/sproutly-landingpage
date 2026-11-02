import { copy } from "@/lib/ui-extra";
import { ui } from "@/lib/ui-text";
import type { Metadata } from "next";
import { Header, Footer } from "@/components/layout";
import { settings } from "@/lib/db";
import { siteUrl } from "@/lib/seo";
import "./globals.css";
const baseMetadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: copy("sproutly_damit_mehr_zeit_fur_dich_bleibt_4b9065"),
    template: copy("_s_sproutly_407c90"),
  },
  description: copy("dein_personlicher_ki_assistent_fur_aufgaben_n_bb19fb"),
  icons: { icon: "/favicon.png" },
};
export async function generateMetadata(): Promise<Metadata> {
  const s = await settings();
  return {
    ...baseMetadata,
    robots: {
      index: Boolean(process.env.NEXT_PUBLIC_SITE_URL) && s.indexable,
      follow: true,
    },
  };
}
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await settings();
  return (
    <html lang="de-CH">
      <body>
        <a href="#main" className="skip">
          {ui("layout_zum_inhalt_springen_0")}
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer settings={s} />
      </body>
    </html>
  );
}
