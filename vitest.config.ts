import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // 화면 흐름을 통째로 돌리는 테스트는 컴퓨터가 바쁠 때(전체 병렬 실행, CI) 기본 5초를 넘기는 일이 있다.
    testTimeout: 20_000,
  },
})
