import type { CompressionV1 } from './types';
import { compress, decompress } from '../index';

/**
 * Adapter that uses the existing string-based ZSTD API.
 * Suitable for text/JSON data where string conversion is acceptable.
 *
 * WARNING: This adapter is NOT binary-safe. Arbitrary bytes may be corrupted
 * during string conversion. Use ZstdBinaryCompression for binary data.
 */
export class ZstdTextCompressionAdapter implements CompressionV1 {
  private readonly defaultLevel: number;

  constructor(defaultLevel: number = 3) {
    this.defaultLevel = defaultLevel;
  }

  compress(bytes: Uint8Array, level?: number): Uint8Array {
    // Convert bytes to string (assumes UTF-8 text content)
    const text = new TextDecoder().decode(bytes);
    const compressed = compress(text, level ?? this.defaultLevel);
    return new Uint8Array(compressed);
  }

  decompress(bytes: Uint8Array): Uint8Array {
    // Create ArrayBuffer from Uint8Array (handle typed array views correctly)
    const buffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    ) as ArrayBuffer;
    const text = decompress(buffer);
    return new TextEncoder().encode(text);
  }
}
