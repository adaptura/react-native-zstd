/**
 * Binary compression tests
 *
 * These tests verify that the binary compression API correctly handles
 * arbitrary byte sequences, including null bytes and high bytes.
 *
 * Note: These tests require native module mocking or running in an
 * actual React Native environment with the native module loaded.
 */

import { compressBytes, decompressBytes } from '../index';

// Mock the native module for unit testing
jest.mock('react-native-nitro-modules', () => ({
  NitroModules: {
    createHybridObject: () => ({
      compress: (data: string, _level: number) => {
        // Simple mock: return a mock compressed buffer
        const encoder = new TextEncoder();
        return encoder.encode(`MOCK_COMPRESSED:${data}`).buffer;
      },
      decompress: (data: ArrayBuffer) => {
        const decoder = new TextDecoder();
        const str = decoder.decode(data);
        return str.replace('MOCK_COMPRESSED:', '');
      },
      compressBytes: (data: ArrayBuffer, _level: number) => {
        // Mock binary compression: prepend a header
        const input = new Uint8Array(data);
        const header = new Uint8Array([0x5a, 0x53, 0x54, 0x44]); // "ZSTD" magic
        const result = new Uint8Array(header.length + input.length);
        result.set(header);
        result.set(input, header.length);
        return result.buffer;
      },
      decompressBytes: (data: ArrayBuffer) => {
        // Mock binary decompression: remove header
        const input = new Uint8Array(data);
        return input.slice(4).buffer;
      },
    }),
  },
}));

describe('Binary Compression - compressBytes/decompressBytes', () => {
  describe('round-trip tests', () => {
    it('handles empty buffer', () => {
      const input = new ArrayBuffer(0);
      const compressed = compressBytes(input, 3);
      const decompressed = decompressBytes(compressed);
      expect(new Uint8Array(decompressed)).toEqual(new Uint8Array(input));
    });

    it('handles buffer with null bytes (0x00)', () => {
      const input = new Uint8Array([0x00, 0x01, 0x00, 0xff, 0x00]).buffer;
      const compressed = compressBytes(input, 3);
      const decompressed = decompressBytes(compressed);
      expect(new Uint8Array(decompressed)).toEqual(
        new Uint8Array([0x00, 0x01, 0x00, 0xff, 0x00])
      );
    });

    it('handles buffer with all byte values (0x00-0xff)', () => {
      const input = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        input[i] = i;
      }
      const compressed = compressBytes(input.buffer, 3);
      const decompressed = decompressBytes(compressed);
      expect(new Uint8Array(decompressed)).toEqual(input);
    });

    it('handles buffer with only 0xff bytes', () => {
      const input = new Uint8Array(100).fill(0xff);
      const compressed = compressBytes(input.buffer, 3);
      const decompressed = decompressBytes(compressed);
      expect(new Uint8Array(decompressed)).toEqual(input);
    });

    it('handles buffer with only 0x00 bytes', () => {
      const input = new Uint8Array(100).fill(0x00);
      const compressed = compressBytes(input.buffer, 3);
      const decompressed = decompressBytes(compressed);
      expect(new Uint8Array(decompressed)).toEqual(input);
    });

    it('handles alternating 0x00 and 0xff bytes', () => {
      const input = new Uint8Array(100);
      for (let i = 0; i < 100; i++) {
        input[i] = i % 2 === 0 ? 0x00 : 0xff;
      }
      const compressed = compressBytes(input.buffer, 3);
      const decompressed = decompressBytes(compressed);
      expect(new Uint8Array(decompressed)).toEqual(input);
    });
  });

  describe('API validation', () => {
    it('compressBytes returns ArrayBuffer', () => {
      const input = new Uint8Array([1, 2, 3]).buffer;
      const result = compressBytes(input, 3);
      expect(result).toBeInstanceOf(ArrayBuffer);
    });

    it('decompressBytes returns ArrayBuffer', () => {
      const input = new Uint8Array([1, 2, 3]).buffer;
      const compressed = compressBytes(input, 3);
      const result = decompressBytes(compressed);
      expect(result).toBeInstanceOf(ArrayBuffer);
    });

    it('accepts default compression level', () => {
      const input = new Uint8Array([1, 2, 3]).buffer;
      // Should not throw when called without level
      const compressed = compressBytes(input);
      expect(compressed).toBeInstanceOf(ArrayBuffer);
    });
  });

  describe('compression levels', () => {
    it('accepts compression level 1 (fastest)', () => {
      const input = new Uint8Array([1, 2, 3, 4, 5]).buffer;
      const compressed = compressBytes(input, 1);
      const decompressed = decompressBytes(compressed);
      expect(new Uint8Array(decompressed)).toEqual(
        new Uint8Array([1, 2, 3, 4, 5])
      );
    });

    it('accepts compression level 19 (best compression)', () => {
      const input = new Uint8Array([1, 2, 3, 4, 5]).buffer;
      const compressed = compressBytes(input, 19);
      const decompressed = decompressBytes(compressed);
      expect(new Uint8Array(decompressed)).toEqual(
        new Uint8Array([1, 2, 3, 4, 5])
      );
    });
  });
});
