// `npm run build` needs the generated page data. If it is missing locally, generate it; in CI the pipeline runs
// `npm run data` explicitly first, so this is a no-op there.
import { access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

try {
  await access(new URL('../public/data/manifest.json', import.meta.url));
} catch {
  console.log('public/data is missing: running the data build (about a minute)…');
  const r = spawnSync(process.execPath, [new URL('./build-data.mjs', import.meta.url).pathname], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
