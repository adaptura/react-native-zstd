import { NitroModules } from 'react-native-nitro-modules';
import type { Zstd } from './Zstd.nitro';

const ZstdHybridObject = NitroModules.createHybridObject<Zstd>('Zstd');

// String-based API (existing - kept for backward compatibility)
export function compress(data: string, compressLevel: number = 3): ArrayBuffer {
  return ZstdHybridObject.compress(data, compressLevel);
}

export function decompress(data: ArrayBuffer): string {
  return ZstdHybridObject.decompress(data);
}

// Binary-safe API (new)
export function compressBytes(
  data: ArrayBuffer,
  compressionLevel: number = 3
): ArrayBuffer {
  return ZstdHybridObject.compressBytes(data, compressionLevel);
}

export function decompressBytes(data: ArrayBuffer): ArrayBuffer {
  return ZstdHybridObject.decompressBytes(data);
}

// Re-export codec types and adapters
export { ZstdBinaryCompression, ZstdTextCompressionAdapter } from './codecs';
export type { BlobCodecV1, CompressionV1 } from './codecs';
