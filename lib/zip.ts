import { inflateRawSync } from "zlib";

// Minimal ZIP reader (central directory + local headers, STORED/DEFLATE only)
// - no external dependency needed for the one thing this project uses it for:
// pulling image files out of a photo ZIP the admin uploads. Does not support
// ZIP64 (>4GB archives / >65535 entries) or encrypted archives - not a
// realistic case for a folder of property photos.
export type ZipEntry = { name: string; data: Buffer };

const EOCD_SIG = 0x06054b50;
const CENTRAL_SIG = 0x02014b50;

function findEocd(buf: Buffer): number {
  const maxCommentLen = 65535;
  const minPos = Math.max(0, buf.length - (22 + maxCommentLen));
  for (let i = buf.length - 22; i >= minPos; i--) {
    if (buf.readUInt32LE(i) === EOCD_SIG) return i;
  }
  throw new Error("Not a valid ZIP file (End Of Central Directory record not found)");
}

export function readZipEntries(buf: Buffer): ZipEntry[] {
  const eocdOffset = findEocd(buf);
  const totalEntries = buf.readUInt16LE(eocdOffset + 10);
  const centralDirOffset = buf.readUInt32LE(eocdOffset + 16);

  const entries: ZipEntry[] = [];
  let offset = centralDirOffset;

  for (let i = 0; i < totalEntries; i++) {
    if (offset + 46 > buf.length || buf.readUInt32LE(offset) !== CENTRAL_SIG) break;

    const compressionMethod = buf.readUInt16LE(offset + 10);
    const compressedSize = buf.readUInt32LE(offset + 20);
    const fileNameLen = buf.readUInt16LE(offset + 28);
    const extraLen = buf.readUInt16LE(offset + 30);
    const commentLen = buf.readUInt16LE(offset + 32);
    const localHeaderOffset = buf.readUInt32LE(offset + 42);
    const name = buf.toString("utf8", offset + 46, offset + 46 + fileNameLen);

    if (!name.endsWith("/") && compressedSize > 0) {
      const localFileNameLen = buf.readUInt16LE(localHeaderOffset + 26);
      const localExtraLen = buf.readUInt16LE(localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + localFileNameLen + localExtraLen;
      const compressed = buf.subarray(dataStart, dataStart + compressedSize);

      let data: Buffer | null = null;
      if (compressionMethod === 0) {
        data = Buffer.from(compressed);
      } else if (compressionMethod === 8) {
        try {
          data = inflateRawSync(compressed);
        } catch {
          data = null;
        }
      }
      if (data) entries.push({ name, data });
    }

    offset += 46 + fileNameLen + extraLen + commentLen;
  }

  return entries;
}
