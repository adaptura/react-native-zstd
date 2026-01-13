import type { CompressionV1 } from './types';
import { compressBytes, decompressBytes } from '../index';

/**
 * Binary-safe ZSTD compression adapter.
 * Uses ArrayBuffer-based API to preserve all byte values including 0x00.
 *
 * This is the preferred adapter for arbitrary binary data like Protobuf,
 * MessagePack, images, or any data that may contain null bytes.
 */
export class ZstdBinaryCompression implements CompressionV1 {
  private readonly defaultLevel: number;

  constructor(defaultLevel: number = 3) {
    this.defaultLevel = defaultLevel;
  }

  compress(bytes: Uint8Array, level?: number): Uint8Array {
    // Convert Uint8Array to ArrayBuffer for native API
    // Handle typed array views correctly
    const inputBuffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    ) as ArrayBuffer;

    const compressed = compressBytes(inputBuffer, level ?? this.defaultLevel);
    return new Uint8Array(compressed);
  }

  decompress(bytes: Uint8Array): Uint8Array {
    // Convert Uint8Array to ArrayBuffer for native API
    // Handle typed array views correctly
    const inputBuffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    ) as ArrayBuffer;

    const decompressed = decompressBytes(inputBuffer);
    return new Uint8Array(decompressed);
  }
}
