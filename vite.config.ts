import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages 프로젝트 사이트는 /keto-fridge/ 하위 경로에 배포되므로 base를 맞춘다.
// 로컬(dev/preview)에서는 "/"로 동작하도록 환경변수로 분기.
const base = process.env.DEPLOY_BASE ?? "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      // 레시피 데이터는 JS 번들에 포함되므로 정적 에셋 프리캐시만으로 완전 오프라인 동작
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico,webmanifest}"],
        // 새 버전 배포 시 서비스워커를 즉시 교체(대기 없이) → 사용자가 새로고침하면 바로 최신
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
      },
      manifest: {
        name: "키토 냉장고",
        short_name: "키토냉장고",
        description: "냉장고에 있는 재료로, 지금 만들 수 있는 키토 레시피",
        lang: "ko",
        start_url: ".",
        scope: ".",
        display: "standalone",
        theme_color: "#047857",
        background_color: "#fafaf9",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  server: { port: 5173 },
});
