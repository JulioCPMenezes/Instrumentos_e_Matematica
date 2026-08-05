import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const out = resolve(root, 'dist');
const items = ['index.html', 'src', 'public', 'README.md', 'SOURCES.md', 'CREDITS.md', 'PLACEHOLDERS.md', 'RELATORIO-DE-MELHORIAS.md', 'COMO-RODAR.txt'];

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

for (const item of items) {
  const from = resolve(root, item);
  try {
    await stat(from);
    await cp(from, resolve(out, item), { recursive: true });
  } catch {
    // Optional documentation files may not exist during early development.
  }
}

console.log('Build estático criado em dist/.');
