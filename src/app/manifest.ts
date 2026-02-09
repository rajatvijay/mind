import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest &
  Record<string, unknown> {
  return {
    name: "Mind",
    short_name: "Mind",
    description: "Save articles. Read later.",
    start_url: "/",
    display: "standalone",
    background_color: "#030712",
    theme_color: "#030712",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    // share_target is not in Next.js types, hence the Record<string, unknown>
    share_target: {
      action: "/share",
      method: "GET",
      params: {
        title: "title",
        text: "text",
        url: "url",
      },
    },
  } as MetadataRoute.Manifest & Record<string, unknown>;
}
