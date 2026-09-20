// download-assets.mjs
//
// Downloads a small set of CC0 hero nature assets from Poly Haven's open API
// (no auth required) into client/public/assets/nature/. These are used as
// "hero" props (a few instances near the player) in the Kerala landscape —
// the bulk of vegetation is generated procedurally in landscape.ts.
//
// Usage:
//   node client/scripts/download-assets.mjs
//
// Re-run any time; already-downloaded files are skipped unless --force is
// passed.

import { mkdir, writeFile, access } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../public/assets/nature');
const RESOLUTION = '1k'; // web-friendly texture size, per plan
const FORCE = process.argv.includes('--force');

// Poly Haven asset slugs we want, and the local folder name to save each under.
const ASSETS = [
  { slug: 'fern_02', label: 'Tropical fern clump (ground cover)' },
  { slug: 'boulder_01', label: 'Mossy boulder (backwater edge)' },
  { slug: 'calathea_orbifolia_01', label: 'Calathea broad-leaf plant (elephant-ear substitute)' },
  { slug: 'anthurium_botany_01', label: 'Anthurium jungle shrub' },
];

const API_BASE = 'https://api.polyhaven.com';

async function exists(p) {
  try {
    await access(p, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json();
}

async function downloadFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(path.dirname(destPath), { recursive: true });
  await writeFile(destPath, buf);
  return buf.length;
}

async function downloadAsset({ slug, label }) {
  const assetDir = path.join(OUT_DIR, slug);
  const gltfMarker = path.join(assetDir, `${slug}.gltf`);

  if (!FORCE && (await exists(gltfMarker))) {
    console.log(`[skip] ${slug} — already downloaded (use --force to re-download)`);
    return;
  }

  console.log(`[fetch] ${slug} (${label}) @ ${RESOLUTION} ...`);

  const filesInfo = await fetchJson(`${API_BASE}/files/${slug}`);
  const gltfInfo = filesInfo?.gltf?.[RESOLUTION]?.gltf;
  if (!gltfInfo) {
    throw new Error(`No ${RESOLUTION} glTF package found for ${slug}`);
  }

  // 1. Download the .gltf manifest itself, renamed to `${slug}.gltf` so
  //    AssetLoader can reference a predictable filename regardless of the
  //    resolution suffix Poly Haven uses in its own filenames.
  let totalBytes = await downloadFile(gltfInfo.url, gltfMarker);

  // 2. Download every included file (the .bin buffer + texture images),
  //    preserving their relative paths (e.g. "textures/foo_diff_1k.jpg").
  const includes = gltfInfo.include ?? {};
  for (const [relPath, meta] of Object.entries(includes)) {
    const destPath = path.join(assetDir, relPath);
    totalBytes += await downloadFile(meta.url, destPath);
  }

  console.log(`[done] ${slug} — ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`Downloading CC0 nature assets from Poly Haven into:\n  ${OUT_DIR}\n`);

  for (const asset of ASSETS) {
    try {
      await downloadAsset(asset);
    } catch (err) {
      console.error(`[error] ${asset.slug}:`, err.message);
      process.exitCode = 1;
    }
  }

  console.log('\nAll done. Assets are CC0 (public domain) — see https://polyhaven.com/license');
}

main();
