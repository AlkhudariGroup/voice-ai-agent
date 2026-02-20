import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Voice AI Agent",
    short_name: "Voice AI",
    description: "Production-ready PWA Voice AI Agent",
    start_url: "/",
    display: "standalone",
    display_override: ["standalone", "fullscreen"],
    background_color: "#0a0a0f",
    theme_color: "#6366f1",
    icons: [
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
