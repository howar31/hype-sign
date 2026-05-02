import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

function resolveCommit(): string {
  // CI exposes the full SHA via GITHUB_SHA; prefer it so the deployed bundle
  // reflects the commit being deployed, not whatever the runner happens to
  // have checked out locally.
  const ciSha = process.env.GITHUB_SHA?.slice(0, 7);
  if (ciSha) return ciSha;
  try {
    const sha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    const dirty = execSync('git status --porcelain', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim().length > 0;
    return dirty ? `${sha}-dirty` : sha;
  } catch {
    return 'dev';
  }
}

const COMMIT = resolveCommit();

export default defineConfig({
  base: '/hype-sign/',
  define: {
    __COMMIT__: JSON.stringify(COMMIT),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Hype Sign',
        short_name: 'Hype Sign',
        description: '電子應援手板 / LED 顯示板 — Cheering board PWA',
        lang: 'zh-TW',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'any',
        start_url: '/hype-sign/',
        scope: '/hype-sign/',
        icons: [
          { src: 'icons/192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff2}'],
        // Default is 2 MiB; the subsetted Noto Sans TC variable woff2 is
        // ~1.7 MB which is just under, but raise the ceiling so we have
        // room before someone bumps the subset coverage.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
