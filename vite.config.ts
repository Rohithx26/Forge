import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { handleFoodRequest } from './server/food.js';

/** serves /api/food during `npm run dev`; in production the Netlify / Vercel function does */
function foodApi(env: { apiKey?: string; groqKey?: string; projectId?: string }): Plugin {
  return {
    name: 'forge-food-api',
    configureServer(server) {
      server.middlewares.use('/api/food', async (req, res) => {
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c as Buffer);
        const headers = { authorization: String(req.headers.authorization ?? '') };
        const r = await handleFoodRequest(new Request('http://localhost/api/food', { method: req.method, headers, body: req.method === 'POST' ? Buffer.concat(chunks) : undefined }), env);
        res.statusCode = r.status;
        res.setHeader('content-type', 'application/json');
        res.end(await r.text());
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
  plugins: [
    react(),
    foodApi({ apiKey: env.GEMINI_API_KEY, groqKey: env.GROQ_API_KEY, projectId: env.VITE_FIREBASE_PROJECT_ID }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Forge — Gym Tracker',
        short_name: 'Forge',
        description: 'Track workouts, follow your split, and hit your calorie targets.',
        theme_color: '#0b0d10',
        background_color: '#0b0d10',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: { navigateFallback: '/index.html', navigateFallbackDenylist: [/^\/api\//], maximumFileSizeToCacheInBytes: 4 * 1024 * 1024 }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          charts: ['recharts']
        }
      }
    }
  },
  test: { environment: 'node' }
  } as any;
});
