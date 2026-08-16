import sharp from "sharp";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const publicDir = path.join(root, "public");
const outDir = path.join(root, "scripts", ".output");

async function renderSvg(file, size) {
  return sharp(file, { density: 512 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();
}

function buildIco(pngBuffers, sizes) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);

  const dir = Buffer.alloc(16 * count);
  let offset = 6 + dir.length;
  const dataParts = [];

  for (let i = 0; i < count; i++) {
    const png = pngBuffers[i];
    const size = sizes[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entry.copy(dir, i * 16);
    dataParts.push(png);
    offset += png.length;
  }

  return Buffer.concat([header, dir, ...dataParts]);
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const badge = path.join(publicDir, "icon.svg");
  const maskable = path.join(publicDir, "icon-maskable.svg");

  const icoSizes = [16, 32, 48, 256];
  const icoPngs = [];
  for (const size of icoSizes) {
    icoPngs.push(await renderSvg(badge, size));
  }
  const ico = buildIco(icoPngs, icoSizes);
  await writeFile(path.join(publicDir, "favicon.ico"), ico);
  console.log("favicon.ico");

  const pngs = {
    "icon-512.png": { file: badge, size: 512 },
    "icon-192.png": { file: badge, size: 192 },
    "apple-icon.png": { file: badge, size: 180 },
    "icon-512-maskable.png": { file: maskable, size: 512 },
  };

  for (const [name, { file, size }] of Object.entries(pngs)) {
    const buf = await renderSvg(file, size);
    await writeFile(path.join(publicDir, name), buf);
    console.log(name);
  }

  const previewBadge = await renderSvg(badge, 256);
  await writeFile(path.join(outDir, "preview-badge.png"), previewBadge);

  const previewMaskable = await renderSvg(maskable, 256);
  await writeFile(path.join(outDir, "preview-maskable.png"), previewMaskable);

  const previewLogo = await sharp(path.join(publicDir, "logo.svg"), { density: 300 })
    .resize(900)
    .png()
    .toBuffer();
  await writeFile(path.join(outDir, "preview-logo.png"), previewLogo);

  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
