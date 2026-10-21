import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { OG_PAGES, withOgCard } from './src/lib/ogCards'

/** Writes dist/og/<page>.html: the built index.html with that page's link card (see vercel.json). */
function ogCardPages(): Plugin {
  return {
    name: 'og-card-pages',
    apply: 'build',
    writeBundle({ dir }) {
      if (!dir) return
      const html = readFileSync(join(dir, 'index.html'), 'utf8')
      mkdirSync(join(dir, 'og'), { recursive: true })
      for (const { page, card } of OG_PAGES) {
        writeFileSync(join(dir, 'og', `${page}.html`), withOgCard(html, card))
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), ogCardPages()],
  // Shown in error alerts so the team knows which deploy a problem came from.
  define: {
    __BUILD_ID__: JSON.stringify((process.env.VERCEL_GIT_COMMIT_SHA ?? 'dev').slice(0, 7)),
  },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
})
