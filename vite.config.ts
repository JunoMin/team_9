import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { marketHandler } from './api/land-market.ts'

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  const handler = marketHandler(env)
  return {
    base: '/team_9/',
    plugins: [
      react(),
      {
        name: 'land-market',
        configureServer(server) {
          server.middlewares.use('/team_9/market-config.js', (_req, res) => {
            res.setHeader('Content-Type', 'application/javascript')
            res.end('window.landMarketEndpoint = "/api/land-market";')
          })
          server.middlewares.use('/api/land-market', handler)
        },
        configurePreviewServer(server) {
          server.middlewares.use('/api/land-market', handler)
        },
        generateBundle() {
          this.emitFile({
            type: 'asset',
            fileName: 'market-config.js',
            source:
              'window.landMarketEndpoint = ' +
              JSON.stringify(env.LAND_MARKET_ENDPOINT || '/api/land-market') +
              ';',
          })
        },
      },
    ],
  }
})
