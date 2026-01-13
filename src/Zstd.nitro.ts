import type { HybridObject } from 'react-native-nitro-modules';

export interface Zstd extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  // String-based API (existing - kept for backward compatibility)
  compress(data: string, compressionLevel: number): ArrayBuffer;
  decompress(data: ArrayBuffer): string;

  // Binary-safe API (new)
  compressBytes(data: ArrayBuffer, compressionLevel: number): ArrayBuffer;
  decompressBytes(data: ArrayBuffer): ArrayBuffer;
}
