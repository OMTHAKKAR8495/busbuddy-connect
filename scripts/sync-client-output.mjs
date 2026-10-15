import { access, cp, mkdir, rm } from 'node:fs/promises';

const candidates = process.env.VERCEL
  ? ['.vercel/output/static', '.output/public']
  : ['.output/public', '.vercel/output/static'];
let source;
for (const candidate of candidates) {
  try {
    await access(candidate);
    source = candidate;
    break;
  } catch {
    // Continue to the next output layout supported by the configured adapter.
  }
}

if (!source) throw new Error('No public build output found in .output/public or .vercel/output/static');

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp(source, 'dist', { recursive: true });
