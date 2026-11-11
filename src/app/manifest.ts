import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "UseLoop — 솔직한 피드백과 서비스 발견",
    short_name: "UseLoop",
    description: "고객의 피드백과 기업의 응답, 새로운 서비스 발견을 잇는 플랫폼",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#fafaf8",
    theme_color: "#1f4fd8",
    lang: "ko",
    categories: ["business", "productivity", "social"],
    icons: [
      {
        src: "/icons/useloop.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/useloop-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
