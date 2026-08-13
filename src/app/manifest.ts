import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kalkulator Spawalniczy TIG",
    short_name: "TIG Calc",
    description:
      "TIG welding estimator: pipes, filler rod, argon, quotes · PL/EN · PLN/USD",
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#020617",
    orientation: "portrait-primary",
    lang: "pl",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
