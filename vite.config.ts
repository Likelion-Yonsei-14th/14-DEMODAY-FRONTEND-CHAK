import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { POST as confirmPayment } from './api/payments/confirm'

// Vercel serves api/ in production; this mirrors the confirm endpoint for `vite dev`.
function tossConfirmDevApi(): Plugin {
  return {
    name: 'toss-confirm-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/payments/confirm', async (req, res) => {
        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk as Buffer)
        const response = await confirmPayment(
          new Request('http://localhost/api/payments/confirm', {
            method: 'POST',
            body: Buffer.concat(chunks),
          }),
        )
        res.statusCode = response.status
        res.setHeader('Content-Type', 'application/json')
        res.end(await response.text())
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  process.env.TOSS_SECRET_KEY ??= loadEnv(mode, process.cwd(), '').TOSS_SECRET_KEY

  return {
    plugins: [react(), tossConfirmDevApi()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  }
})
