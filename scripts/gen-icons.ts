/**
 * gen-icons.ts — 의존성 없는 PWA 아이콘 생성 (node:zlib만 사용)
 * 에메랄드 배경 + 흰 접시(링) + 아보카도 씨앗 모티프의 단순 마크.
 * public/icons/icon-192.png, icon-512.png, apple-touch-icon.png(180) 생성.
 */
import { deflateSync, crc32 } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");

const EMERALD: RGB = [4, 120, 87]; // emerald-700
const WHITE: RGB = [255, 255, 255];
const LIGHT: RGB = [209, 250, 229]; // emerald-100
type RGB = [number, number, number];

function drawIcon(size: number): Buffer {
  const px = new Uint8Array(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size * 0.34; // 접시 외곽
  const rInner = size * 0.26; // 접시 안쪽
  const rSeed = size * 0.13; // 씨앗
  const corner = size * 0.22; // 라운드 코너

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // 라운드 사각형 배경 (밖은 투명)
      const dx = Math.max(Math.abs(x - cx) - (cx - corner), 0);
      const dy = Math.max(Math.abs(y - cy) - (cy - corner), 0);
      const inBg = Math.hypot(dx, dy) <= corner;

      let color: RGB | null = null;
      let alpha = 0;
      if (inBg) {
        color = EMERALD;
        alpha = 255;
        const d = Math.hypot(x - cx, y - cy);
        if (d <= rOuter && d >= rInner) color = WHITE; // 링(접시)
        else if (d < rSeed) color = LIGHT; // 씨앗
      }
      const i = (y * size + x) * 4;
      if (color) {
        px[i] = color[0];
        px[i + 1] = color[1];
        px[i + 2] = color[2];
        px[i + 3] = alpha;
      }
    }
  }
  return encodePng(size, size, px);
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(w: number, h: number, rgba: Uint8Array): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0; // filter: none
    raw.set(rgba.subarray(y * w * 4, (y + 1) * w * 4), y * (1 + w * 4) + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT, { recursive: true });
for (const [name, size] of [["icon-192.png", 192], ["icon-512.png", 512], ["apple-touch-icon.png", 180]] as const) {
  writeFileSync(join(OUT, name), drawIcon(size));
  console.log(`✓ ${name} (${size}x${size})`);
}
