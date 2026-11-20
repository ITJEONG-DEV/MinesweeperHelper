// 의존성 없이 PWA 아이콘 PNG(192·512)를 만든다. 파란 바탕에 흰 3x3 판, 닫힌 칸 몇 개와 가운데 지뢰.
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

function icon(size) {
  const BG = [0x2f, 0x5b, 0xd3];
  const WHITE = [0xff, 0xff, 0xff];
  const GRAY = [0xc9, 0xcf, 0xdc];
  const LINE = [0x1c, 0x22, 0x33];
  const inset = Math.round(size * 0.2);
  const boardSize = size - inset * 2;
  const cell = boardSize / 3;
  const thick = Math.max(2, Math.round(size / 64));
  const thin = Math.max(1, Math.round(size / 160));
  const closed = new Set(['0,0', '2,0', '1,2', '2,2']);
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      let px = BG;
      const bx = x - inset;
      const by = y - inset;
      if (bx >= 0 && by >= 0 && bx < boardSize && by < boardSize) {
        const cx = Math.floor(bx / cell);
        const cy = Math.floor(by / cell);
        px = closed.has(`${cx},${cy}`) ? GRAY : WHITE;
        // 가운데 지뢰: 원과 가시
        const dx = bx - boardSize / 2;
        const dy = by - boardSize / 2;
        const r = cell * 0.22;
        const spike = cell * 0.36;
        const sw = Math.max(1.5, size / 70);
        if (dx * dx + dy * dy < r * r) px = LINE;
        else if (Math.abs(dx) < spike && Math.abs(dy) < spike) {
          if (Math.abs(dx) < sw / 2 || Math.abs(dy) < sw / 2 || Math.abs(Math.abs(dx) - Math.abs(dy)) < sw * 0.7) {
            if (Math.hypot(dx, dy) < spike) px = LINE;
          }
        }
        for (let k = 1; k < 3; k++) {
          const pos = Math.round(k * cell);
          if (Math.abs(bx - pos) < thin || Math.abs(by - pos) < thin) px = LINE;
        }
        if (bx < thick || by < thick || bx >= boardSize - thick || by >= boardSize - thick) px = LINE;
      }
      const o = y * (size * 3 + 1) + 1 + x * 3;
      raw[o] = px[0];
      raw[o + 1] = px[1];
      raw[o + 2] = px[2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [192, 512]) {
  writeFileSync(new URL(`../public/icon-${size}.png`, import.meta.url), icon(size));
}
console.log('icons written');
