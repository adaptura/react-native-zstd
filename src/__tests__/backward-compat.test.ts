/**
 * Backward compatibility tests
 *
 * These tests verify that the existing string-based API remains unchanged
 * and that both APIs can coexist.
 */

import { compress, compressBytes, decompress, decompressBytes } from '../index';

// Mock the native module for unit testing
jest.mock('react-native-nitro-modules', () => ({
  NitroModules: {
    createHybridObject: () => ({
      compress: (data: string, _level: number) => {
        // Simulate string compression: encode string to bytes
        const encoder = new TextEncoder();
        const bytes = encoder.encode(data);
        // Prepend header to simulate compression
        const header = new Uint8Array([0x5a, 0x53, 0x54, 0x44]);
        const result = new Uint8Array(header.length + bytes.length);
        result.set(header);
        result.set(bytes, header.length);
        return result.buffer;
      },
      decompress: (data: ArrayBuffer) => {
        // Simulate string decompression: remove header and decode
        const bytes = new Uint8Array(data);
        const content = bytes.slice(4);
        const decoder = new TextDecoder();
        return decoder.decode(content);
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
        return input.slice(4).buffer;
      },
    }),
  },
}));

describe('Backward Compatibility', () => {
  describe('existing string API unchanged', () => {
    it('compress accepts string input', () => {
      const result = compress('hello', 3);
      expect(result).toBeInstanceOf(ArrayBuffer);
    });

    it('compress returns ArrayBuffer', () => {
      const result = compress('hello world', 3);
      expect(result).toBeInstanceOf(ArrayBuffer);
    });

    it('decompress accepts ArrayBuffer', () => {
      const compressed = compress('hello', 3);
      const result = decompress(compressed);
      expect(typeof result).toBe('string');
    });

    it('decompress returns string', () => {
      const compressed = compress('hello world', 3);
      const result = decompress(compressed);
      expect(typeof result).toBe('string');
      expect(result).toBe('hello world');
    });

    it('round-trips simple text', () => {
      const text = 'Hello, World!';
      const compressed = compress(text, 3);
      const decompressed = decompress(compressed);
      expect(decompressed).toBe(text);
    });

    it('round-trips empty string', () => {
      const text = '';
      const compressed = compress(text, 3);
      const decompressed = decompress(compressed);
      expect(decompressed).toBe(text);
    });

    it('handles UTF-8 characters', () => {
      const text = 'Hello 世界 🌍 émojis';
      const compressed = compress(text, 3);
      const decompressed = decompress(compressed);
      expect(decompressed).toBe(text);
    });

    it('uses default compression level when not specified', () => {
      const text = 'test';
      // Should not throw when called without level
      const compressed = compress(text);
      expect(compressed).toBeInstanceOf(ArrayBuffer);
    });
  });

  describe('new binary API coexists', () => {
    it('compressBytes exists alongside compress', () => {
      expect(typeof compress).toBe('function');
      expect(typeof compressBytes).toBe('function');
    });

    it('decompressBytes exists alongside decompress', () => {
      expect(typeof decompress).toBe('function');
      expect(typeof decompressBytes).toBe('function');
    });

    it('binary API returns ArrayBuffer, not string', () => {
      const input = new TextEncoder().encode('test').buffer as ArrayBuffer;
      const compressed = compressBytes(input, 3);
      const decompressed = decompressBytes(compressed);
      expect(decompressed).toBeInstanceOf(ArrayBuffer);
      expect(typeof decompressed).not.toBe('string');
    });
  });

  describe('API interoperability', () => {
    it('string and binary APIs produce compatible output for text', () => {
      const text = 'test string for comparison';

      const stringCompressed = compress(text, 3);
      const binaryInput = new TextEncoder().encode(text).buffer as ArrayBuffer;
      const binaryCompressed = compressBytes(binaryInput, 3);

      // Both should produce ArrayBuffer
      expect(stringCompressed).toBeInstanceOf(ArrayBuffer);
      expect(binaryCompressed).toBeInstanceOf(ArrayBuffer);

      // With our mock, compressed bytes should be identical since
      // both use the same underlying byte representation
      expect(new Uint8Array(stringCompressed)).toEqual(
        new Uint8Array(binaryCompressed)
      );
    });

    it('binary-compressed text can be decoded as string after decompression', () => {
      const text = 'Hello, World!';
      const binaryInput = new TextEncoder().encode(text).buffer as ArrayBuffer;
      const compressed = compressBytes(binaryInput, 3);
      const decompressed = decompressBytes(compressed);

      // Decode the binary result as text
      const decoder = new TextDecoder();
      const result = decoder.decode(decompressed);
      expect(result).toBe(text);
    });
  });
});
