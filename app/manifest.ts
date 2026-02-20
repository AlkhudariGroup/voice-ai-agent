import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "E-Commerce Voice AI",
    short_name: "E-Commerce",
    description: "Voice AI assistant for e-commerce stores",
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
      {
        src: "/logo.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
