import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { handleAIRequest } from './server/ai/handler.js';
import { validatePayloadSize } from './server/ai/security.js';

function aiDevServerPlugin() {
  return {
    name: 'taskbar-ai-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : '';
        if (url.startsWith('/api/ai')) {
          let bodyData = '';
          req.on('data', chunk => {
            bodyData += chunk;
            try {
              validatePayloadSize(bodyData);
            } catch (err) {
              res.statusCode = 413;
              res.end(JSON.stringify({ error: err.message }));
              req.destroy();
            }
          });
          req.on('end', () => {
            let parsedBody = {};
            if (bodyData) {
              try {
                parsedBody = JSON.parse(bodyData);
              } catch {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Malformed JSON payload' }));
                return;
              }
            }
            handleAIRequest(req, res, url, parsedBody);
          });
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  // Load server-side environment variables into process.env
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [react(), aiDevServerPlugin()],
    server: {
      port: 5173,
    },
    base: './',
  };
});
