import { copy } from "@/lib/ui-extra";
import { ui } from "@/lib/ui-text";
import { ImageResponse } from "next/og";
export const alt = copy("sproutly_damit_mehr_zeit_fur_dich_bleibt_4b9065");
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#fcf8f6",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 90,
        color: "#30232f",
      }}
    >
      <div style={{ fontSize: 30, color: "#b62a78", marginBottom: 35 }}>
        {ui("opengraph-image_sproutly_0")}
      </div>
      <div
        style={{
          fontSize: 80,
          lineHeight: 1.1,
          letterSpacing: -3,
          maxWidth: 900,
        }}
      >
        {ui("opengraph-image_damit_mehr_zeit_fur_dich_bleibt__1")}
      </div>
      <div style={{ fontSize: 26, marginTop: 35 }}>
        {ui(
          "opengraph-image_dein_personlicher_ki_assistent_fur_deinen_alltag__2",
        )}
      </div>
    </div>,
    size,
  );
}
