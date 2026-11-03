import http from 'http';
import { handleAIRequest } from './ai/handler.js';
import { validatePayloadSize } from './ai/security.js';

const PORT = parseInt(process.env.PORT || '5174', 10);

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  if (pathname.startsWith('/api/ai')) {
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
      handleAIRequest(req, res, pathname, parsedBody);
    });
  } else {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`[TaskBar OS] AI Server active on http://localhost:${PORT}`);
});

