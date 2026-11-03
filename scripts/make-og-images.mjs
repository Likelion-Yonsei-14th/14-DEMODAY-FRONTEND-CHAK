#!/usr/bin/env node
/**
 * Draws the link-card thumbnails (public/assets/og/*.png, 1200x630).
 *
 * The cards are drawn by the app itself at /__og/<name> (development only), so
 * they use the same drawings as the games. Run the dev server, then:
 *
 *   npm run dev            # in one terminal
 *   node scripts/make-og-images.mjs [name ...]   # in another; no names = all
 *
 * Needs Google Chrome (set CHROME to its path if it is not in the usual place).
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const BASE = process.env.OG_BASE ?? 'http://localhost:5173'
const OUT = 'public/assets/og'
const CHROME =
  process.env.CHROME ??
  ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync)

const SLUGS = [
  'perfect-planner',
  'routine-master',
  'study-leader',
  'challenge-collector',
  'last-minute-awakener',
  'easygoing-solo',
  'all-nighter-captain',
  'cafe-first',
]

const ALL = [
  'desk-blast',
  'sneaky-phone',
  'study-type',
  'exam-career',
  'd1-course',
  'guess-god',
  'promotion',
  'desk',
  'claim',
  'classroom-join',
  ...SLUGS.map((slug) => `study-type-${slug}`),
]

if (!CHROME) {
  console.error('Chrome was not found. Set CHROME=/path/to/chrome.')
  process.exit(1)
}

const names = process.argv.slice(2).length ? process.argv.slice(2) : ALL
mkdirSync(OUT, { recursive: true })

for (const name of names) {
  const file = join(OUT, `${name}.png`)
  execFileSync(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--window-size=1200,630',
      '--virtual-time-budget=6000',
      `--screenshot=${file}`,
      `${BASE}/__og/${name}`,
    ],
    { stdio: 'ignore' },
  )
  console.log('wrote', file)
}
