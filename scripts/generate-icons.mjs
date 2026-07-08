// Generates the LibrAIum app icon (1024x1024 PNG) with zero dependencies,
// drawing a "library shelf + AI orb" mark on an indigo rounded square.
// macOS `sips` + `iconutil` are then used by scripts/make-icons.sh to derive
// all sizes and the .icns bundle icon.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SIZE = 1024;
const px = new Uint8Array(SIZE * SIZE * 4);

const bg = [15, 15, 35]; // page background (transparent corners outside radius)
const indigoTop = [99, 102, 241];
const indigoBottom = [49, 46, 129];
const cream = [245, 240, 225];
const gold = [251, 191, 36];

const R = 200; // corner radius
function insideRoundedRect(x, y) {
  const cx = Math.min(Math.max(x, R), SIZE - R);
  const cy = Math.min(Math.max(y, R), SIZE - R);
  const dx = x - cx, dy = y - cy;
  return dx * dx + dy * dy <= R * R;
}

function set(x, y, [r, g, b], a = 255) {
  const i = (y * SIZE + x) * 4;
  px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a;
}

// Books on a shelf: [x, width, top, color] — bottom is the shelf line.
const shelfY = 800;
const books = [
  [210, 110, 320, cream],
  [340, 110, 260, gold],
  [470, 110, 300, cream],
  [600, 110, 230, cream],
  [730, 110, 290, gold],
];

for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    if (!insideRoundedRect(x, y)) { set(x, y, bg, 0); continue; }
    // vertical gradient
    const t = y / SIZE;
    const grad = indigoTop.map((c, i) => Math.round(c + (indigoBottom[i] - c) * t));
    let color = grad;
    // shelf
    if (y >= shelfY && y < shelfY + 36 && x >= 170 && x < 870) color = cream;
    // books
    for (const [bx, bw, top, c] of books) {
      if (x >= bx && x < bx + bw && y >= top && y < shelfY) {
        color = c;
        // spine shading strip
        if (x - bx < 14) color = c.map((v) => Math.max(0, v - 45));
      }
    }
    // AI orb (top-right)
    const ox = 800, oy = 210, or_ = 90;
    const d2 = (x - ox) ** 2 + (y - oy) ** 2;
    if (d2 <= or_ * or_) color = gold;
    if (d2 > or_ * or_ && d2 <= (or_ + 14) ** 2) color = cream;
    set(x, y, color);
  }
}

// --- minimal PNG encoder ---
const TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8;  // bit depth
ihdr[9] = 6;  // RGBA
const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0; // filter: none
  Buffer.from(px.buffer, y * SIZE * 4, SIZE * 4).copy(raw, y * (SIZE * 4 + 1) + 1);
}
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..", "src-tauri", "icons");
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "icon-1024.png"), png);
console.log("wrote", join(out, "icon-1024.png"), `${png.length} bytes`);
