/**
 * Fuzz tests for binary compression
 *
 * These tests verify that compression works correctly with random data
 * of various sizes, ensuring the round-trip preserves all bytes.
 */

import { compressBytes, decompressBytes } from '../index';

// Mock the native module for unit testing
jest.mock('react-native-nitro-modules', () => ({
  NitroModules: {
    createHybridObject: () => ({
      compress: (data: string, _level: number) => {
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
        const header = new Uint8Array([0x5a, 0x53, 0x54, 0x44]);
        const result = new Uint8Array(header.length + input.length);
        result.set(header);
        result.set(input, header.length);
        return result.buffer;
      },
      decompressBytes: (data: ArrayBuffer) => {
        // Mock binary decompression: remove header
        const input = new Uint8Array(data);
        // Guard for empty or short buffers
        if (input.length < 4) {
          return new ArrayBuffer(0);
        }
        return input.slice(4).buffer;
      },
    }),
  },
}));

// Simple seeded PRNG for reproducible tests
const createSeededRandom = (seed: number) => {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
};

describe('Fuzz Tests', () => {
  const generateRandomBytes = (
    size: number,
    seed: number = 12345
  ): Uint8Array => {
    const random = createSeededRandom(seed);
    const bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      bytes[i] = Math.floor(random() * 256);
    }
    return bytes;
  };

  describe('random data round-trips', () => {
    it.each([
      ['tiny (10 bytes)', 10],
      ['small (100 bytes)', 100],
      ['medium (10KB)', 10_000],
      ['large (100KB)', 100_000],
    ])('round-trips %s random data', (_, size) => {
      const input = generateRandomBytes(size);
      const compressed = compressBytes(input.buffer as ArrayBuffer, 3);
      const decompressed = decompressBytes(compressed);
      expect(new Uint8Array(decompressed)).toEqual(input);
    });
  });

  describe('multiple iterations', () => {
    it('handles 50 iterations with varying sizes', () => {
      const sizeRandom = createSeededRandom(98765);
      for (let i = 0; i < 50; i++) {
        const size = Math.floor(sizeRandom() * 5000) + 1;
        const input = generateRandomBytes(size, i);
        const compressed = compressBytes(input.buffer as ArrayBuffer, 3);
        const decompressed = decompressBytes(compressed);
        expect(new Uint8Array(decompressed)).toEqual(input);
      }
    });

    it('handles edge-case sizes', () => {
      const edgeCases = [
        1, 2, 3, 7, 8, 15, 16, 31, 32, 63, 64, 127, 128, 255, 256, 511, 512,
        1023, 1024,
      ];
      for (const size of edgeCases) {
        const input = generateRandomBytes(size);
        const compressed = compressBytes(input.buffer as ArrayBuffer, 3);
        const decompressed = decompressBytes(compressed);
        expect(new Uint8Array(decompressed)).toEqual(input);
      }
    });
  });

  describe('specific byte patterns', () => {
    it('handles repeating byte patterns', () => {
      // Create pattern that might trigger compression edge cases
      const pattern = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
      const input = new Uint8Array(1000);
      for (let i = 0; i < 1000; i++) {
        input[i] = pattern[i % 4]!;
      }
      const compressed = compressBytes(input.buffer, 3);
      const decompressed = decompressBytes(compressed);
      expect(new Uint8Array(decompressed)).toEqual(input);
    });

    it('handles incrementing byte sequence', () => {
      const input = new Uint8Array(1000);
      for (let i = 0; i < 1000; i++) {
        input[i] = i % 256;
      }
      const compressed = compressBytes(input.buffer, 3);
      const decompressed = decompressBytes(compressed);
      expect(new Uint8Array(decompressed)).toEqual(input);
    });

    it('handles mixed null and random bytes', () => {
      const random = createSeededRandom(54321);
      const input = new Uint8Array(1000);
      for (let i = 0; i < 1000; i++) {
        // 50% chance of null byte
        input[i] = random() < 0.5 ? 0x00 : Math.floor(random() * 256);
      }
      const compressed = compressBytes(input.buffer, 3);
      const decompressed = decompressBytes(compressed);
      expect(new Uint8Array(decompressed)).toEqual(input);
    });

    it('handles all-zeros buffer', () => {
      const input = new Uint8Array(1000).fill(0x00);
      const compressed = compressBytes(input.buffer, 3);
      const decompressed = decompressBytes(compressed);
      expect(new Uint8Array(decompressed)).toEqual(input);
    });

    it('handles all-0xFF buffer', () => {
      const input = new Uint8Array(1000).fill(0xff);
      const compressed = compressBytes(input.buffer, 3);
      const decompressed = decompressBytes(compressed);
      expect(new Uint8Array(decompressed)).toEqual(input);
    });

    it('handles empty ArrayBuffer', () => {
      const input = new ArrayBuffer(0);
      const compressed = compressBytes(input, 3);
      const decompressed = decompressBytes(compressed);
      expect(decompressed).toBeInstanceOf(ArrayBuffer);
      expect(decompressed.byteLength).toBe(0);
    });
  });
});
