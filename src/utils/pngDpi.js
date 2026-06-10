const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const PHYS_CHUNK_TYPE = [112, 72, 89, 115];
let crcTable = null;

function getCrcTable() {
  if (crcTable) return crcTable;

  crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c >>> 0;
  }

  return crcTable;
}

function crc32(bytes) {
  const table = getCrcTable();
  let crc = 0xffffffff;

  for (let i = 0; i < bytes.length; i += 1) {
    crc = table[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint32(bytes, offset, value) {
  bytes[offset] = (value >>> 24) & 0xff;
  bytes[offset + 1] = (value >>> 16) & 0xff;
  bytes[offset + 2] = (value >>> 8) & 0xff;
  bytes[offset + 3] = value & 0xff;
}

function readUint32(bytes, offset) {
  return (
    bytes[offset] * 0x1000000 +
    ((bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3])
  );
}

function isPng(bytes) {
  return PNG_SIGNATURE.every((value, index) => bytes[index] === value);
}

function createPhysChunk(dpi) {
  const pixelsPerMeter = Math.round((Number(dpi) || 300) / 0.0254);
  const chunk = new Uint8Array(21);
  const crcInput = new Uint8Array(13);

  writeUint32(chunk, 0, 9);
  chunk.set(PHYS_CHUNK_TYPE, 4);
  writeUint32(chunk, 8, pixelsPerMeter);
  writeUint32(chunk, 12, pixelsPerMeter);
  chunk[16] = 1;

  crcInput.set(PHYS_CHUNK_TYPE, 0);
  crcInput.set(chunk.slice(8, 17), 4);
  writeUint32(chunk, 17, crc32(crcInput));

  return chunk;
}

async function addPngDpiMetadata(blob, dpi) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  if (!isPng(bytes)) return blob;

  const physChunk = createPhysChunk(dpi);
  const parts = [bytes.slice(0, 8)];
  let offset = 8;
  let inserted = false;

  while (offset + 12 <= bytes.length) {
    const chunkLength = readUint32(bytes, offset);
    const chunkEnd = offset + 12 + chunkLength;
    if (chunkEnd > bytes.length) return blob;

    const chunkType = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7]
    );

    if (chunkType !== 'pHYs') {
      parts.push(bytes.slice(offset, chunkEnd));
    }

    if (chunkType === 'IHDR') {
      parts.push(physChunk);
      inserted = true;
    }

    offset = chunkEnd;
  }

  return inserted ? new Blob(parts, { type: 'image/png' }) : blob;
}

function downloadUrl(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });
}

export async function downloadCanvasAsPng(canvas, filename, { dpi } = {}) {
  try {
    const blob = await canvasToBlob(canvas);
    if (!blob) throw new Error('Canvas PNG export failed');

    const finalBlob = dpi ? await addPngDpiMetadata(blob, dpi) : blob;
    const url = URL.createObjectURL(finalBlob);
    downloadUrl(url, filename);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    downloadUrl(canvas.toDataURL('image/png'), filename);
  }
}
