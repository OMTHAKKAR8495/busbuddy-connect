import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const forbidden = [/service_role/i, /postgresql:\/\//i, /npg_/i, /sb_secret_/i];
const failures = [];

if (process.argv.includes('--env')) {
  for (const [name, value] of Object.entries(process.env)) {
    if (name.startsWith('VITE_') && forbidden.some((pattern) => pattern.test(value ?? ''))) {
      failures.push(`Unsafe secret-like value in ${name}`);
    }
  }
}

if (process.argv.includes('--dist')) {
  const walk = async (directory) => {
    let entries;
    try { entries = await readdir(directory, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(file);
      else {
        if (file.endsWith('.map')) failures.push(`Source map found in ${file}`);
        const content = await readFile(file);
        if (forbidden.some((pattern) => pattern.test(content.toString('utf8')))) failures.push(`Forbidden secret marker in ${file}`);
      }
    }
  };
  await walk('dist');
  await walk('.output/public');
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
}
