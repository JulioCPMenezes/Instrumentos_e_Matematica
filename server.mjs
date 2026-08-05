import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const requestedRoot = process.argv[2] || '.';
const root = resolve(process.cwd(), requestedRoot);
const port = Number(process.env.PORT || 4173);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.csv': 'text/csv; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.webmanifest': 'application/manifest+json'
};

const server = createServer((request, response) => {
  const rawPath = decodeURIComponent((request.url || '/').split('?')[0]);
  const safePath = normalize(rawPath).replace(/^(\.\.[/\\])+/, '');
  let filePath = join(root, safePath === '/' ? 'index.html' : safePath);

  if (!filePath.startsWith(root)) {
    response.writeHead(403).end('Acesso negado');
    return;
  }

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, 'index.html');
  }

  if (!existsSync(filePath)) {
    const fallback = join(root, 'index.html');
    if (existsSync(fallback) && !extname(safePath)) {
      filePath = fallback;
    } else {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Arquivo não encontrado');
      return;
    }
  }

  const extension = extname(filePath).toLowerCase();
  const size = statSync(filePath).size;
  const headers = {
    'Content-Type': types[extension] || 'application/octet-stream',
    'Cache-Control': 'no-store, max-age=0, must-revalidate',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Accept-Ranges': 'bytes'
  };
  const range = request.headers.range;

  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) {
      response.writeHead(416, { ...headers, 'Content-Range': `bytes */${size}` }).end();
      return;
    }
    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
    if (start > end || start >= size) {
      response.writeHead(416, { ...headers, 'Content-Range': `bytes */${size}` }).end();
      return;
    }
    response.writeHead(206, {
      ...headers,
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Length': end - start + 1
    });
    createReadStream(filePath, { start, end }).pipe(response);
    return;
  }

  response.writeHead(200, { ...headers, 'Content-Length': size });
  createReadStream(filePath).pipe(response);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`\nSite disponível em: http://localhost:${port}\n`);
  console.log('Para encerrar, pressione Ctrl + C.');
});
