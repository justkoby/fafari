import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import { handleAssistant } from './api/assistant-core';

/* Local stand-in for the Vercel serverless route so `npm run dev` serves
   POST /api/assistant exactly like production. The Groq key is read from
   the server environment (.env via loadEnv, or process.env) and passed to
   the shared core — it is never exposed to the browser. In production the
   same core runs from api/assistant.ts. */
function assistantApi(): Plugin {
  return {
    name: 'fafari-assistant-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/assistant', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Use POST.' }));
          return;
        }

        let raw = '';
        req.on('data', (chunk) => {
          raw += chunk;
        });
        req.on('end', async () => {
          let parsed: unknown = {};
          try {
            parsed = raw ? JSON.parse(raw) : {};
          } catch {
            parsed = {};
          }
          const env = loadEnv(server.config.mode, server.config.root, '');
          const apiKey = process.env.GROQ_API_KEY || env.GROQ_API_KEY || '';
          const model = process.env.GROQ_MODEL || env.GROQ_MODEL;
          try {
            const result = await handleAssistant(parsed, { apiKey, model });
            res.statusCode = result.status;
            res.end(JSON.stringify(result.body));
          } catch {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Unexpected server error.' }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), assistantApi()],
  server: {
    port: 5173,
    host: true,
  },
});
