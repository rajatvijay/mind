import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest &
  Record<string, unknown> {
  return {
    id: "/",
    name: "Mind",
    short_name: "Mind",
    description: "Save articles. Read later.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#030712",
    theme_color: "#030712",
    categories: ["productivity", "news"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    // share_target uses POST to avoid URL length limits on Android
    share_target: {
      action: "/api/share",
      method: "POST",
      enctype: "multipart/form-data",
      params: {
        title: "title",
        text: "text",
        url: "url",
      },
    },
    handle_links: "preferred",
  } as MetadataRoute.Manifest & Record<string, unknown>;
}
