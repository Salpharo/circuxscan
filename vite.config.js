import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'node:path'
import fs from 'node:fs'

const modelsDir = path.resolve(process.cwd(), '3Dmodels')
const publicModelsDir = path.resolve(process.cwd(), 'public', '3Dmodels')

/** Serve repo /3Dmodels in dev; copy into public/3Dmodels on build for Vercel/static hosts. */
function localModelsPlugin() {
  return {
    name: 'local-3dmodels',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url || '').split('?')[0]
        if (!pathname.startsWith('/3Dmodels/')) return next()
        const name = path.basename(pathname)
        if (!name || name === '.' || name === '..') return next()
        const file = path.join(modelsDir, name)
        if (!file.startsWith(modelsDir) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
          return next()
        }
        const ct = name.toLowerCase().endsWith('.gltf')
          ? 'model/gltf+json'
          : 'model/gltf-binary'
        res.setHeader('Content-Type', ct)
        fs.createReadStream(file).pipe(res)
      })
    },
    buildStart() {
      if (!fs.existsSync(modelsDir)) return
      fs.mkdirSync(publicModelsDir, { recursive: true })
      for (const name of fs.readdirSync(modelsDir)) {
        if (!/\.(glb|gltf)$/i.test(name)) continue
        fs.copyFileSync(path.join(modelsDir, name), path.join(publicModelsDir, name))
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  plugins: [
    localModelsPlugin(),
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }),
    react(),
  ]
});