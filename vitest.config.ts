import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'app/lib/utils.ts',
        'app/lib/surf-spots.ts',
        'app/lib/surf-rating.ts',
        'app/lib/climatology.ts',
        'app/lib/session-score.ts',
        'app/lib/server-t.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
