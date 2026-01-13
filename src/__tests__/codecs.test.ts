/**
 * Codec adapter tests
 *
 * These tests verify that the compression adapters correctly implement
 * the CompressionV1 interface and handle data appropriately.
 */

import type { CompressionV1 } from '../codecs';
import { ZstdBinaryCompression, ZstdTextCompressionAdapter } from '../codecs';

// Mock the native module for unit testing
jest.mock('react-native-nitro-modules', () => ({
  NitroModules: {
    createHybridObject: () => ({
      compress: (data: string, _level: number) => {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(data);
        const header = new Uint8Array([0x5a, 0x53, 0x54, 0x44]);
        const result = new Uint8Array(header.length + bytes.length);
        result.set(header);
        result.set(bytes, header.length);
        return result.buffer;
      },
      decompress: (data: ArrayBuffer) => {
        const bytes = new Uint8Array(data);
        const content = bytes.slice(4);
        const decoder = new TextDecoder();
        return decoder.decode(content);
      },
      compressBytes: (data: ArrayBuffer, _level: number) => {
        const input = new Uint8Array(data);
        const header = new Uint8Array([0x5a, 0x53, 0x54, 0x44]);
        const result = new Uint8Array(header.length + input.length);
        result.set(header);
        result.set(input, header.length);
        return result.buffer;
      },
      decompressBytes: (data: ArrayBuffer) => {
        const input = new Uint8Array(data);
        return input.slice(4).buffer;
      },
    }),
  },
}));

describe('ZstdBinaryCompression', () => {
  let codec: CompressionV1;

  beforeEach(() => {
    codec = new ZstdBinaryCompression(3);
  });

  describe('interface compliance', () => {
    it('implements CompressionV1 interface', () => {
      expect(typeof codec.compress).toBe('function');
      expect(typeof codec.decompress).toBe('function');
    });

    it('compress returns Uint8Array', () => {
      const input = new Uint8Array([1, 2, 3]);
      const result = codec.compress(input);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('decompress returns Uint8Array', () => {
      const input = new Uint8Array([1, 2, 3]);
      const compressed = codec.compress(input);
      const result = codec.decompress(compressed);
      expect(result).toBeInstanceOf(Uint8Array);
    });
  });

  describe('binary safety', () => {
    it('round-trips binary data with null bytes', () => {
      const input = new Uint8Array([0x00, 0x01, 0x00, 0x02]);
      const compressed = codec.compress(input);
      const decompressed = codec.decompress(compressed);
      expect(decompressed).toEqual(input);
    });

    it('round-trips binary data with 0xff bytes', () => {
      const input = new Uint8Array([0xff, 0xfe, 0xff, 0xfd]);
      const compressed = codec.compress(input);
      const decompressed = codec.decompress(compressed);
      expect(decompressed).toEqual(input);
    });

    it('round-trips all byte values', () => {
      const input = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        input[i] = i;
      }
      const compressed = codec.compress(input);
      const decompressed = codec.decompress(compressed);
      expect(decompressed).toEqual(input);
    });
  });

  describe('compression level', () => {
    it('accepts custom compression level in constructor', () => {
      const fastCodec = new ZstdBinaryCompression(1);
      const input = new Uint8Array([1, 2, 3, 4, 5]);
      const compressed = fastCodec.compress(input);
      const decompressed = fastCodec.decompress(compressed);
      expect(decompressed).toEqual(input);
    });

    it('accepts compression level in compress call', () => {
      const input = new Uint8Array([1, 2, 3, 4, 5]);
      const compressed = codec.compress(input, 10);
      const decompressed = codec.decompress(compressed);
      expect(decompressed).toEqual(input);
    });

    it('uses default level when not specified', () => {
      const input = new Uint8Array([1, 2, 3, 4, 5]);
      // Should not throw
      const compressed = codec.compress(input);
      expect(compressed).toBeInstanceOf(Uint8Array);
    });
  });

  describe('Uint8Array view handling', () => {
    it('handles Uint8Array views with non-zero offset', () => {
      const buffer = new ArrayBuffer(10);
      const fullView = new Uint8Array(buffer);
      fullView.set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

      // Create a view with offset
      const viewWithOffset = new Uint8Array(buffer, 2, 5);
      expect(Array.from(viewWithOffset)).toEqual([2, 3, 4, 5, 6]);

      const compressed = codec.compress(viewWithOffset);
      const decompressed = codec.decompress(compressed);
      expect(decompressed).toEqual(viewWithOffset);
    });
  });
});

describe('ZstdTextCompressionAdapter', () => {
  let codec: CompressionV1;

  beforeEach(() => {
    codec = new ZstdTextCompressionAdapter(3);
  });

  describe('interface compliance', () => {
    it('implements CompressionV1 interface', () => {
      expect(typeof codec.compress).toBe('function');
      expect(typeof codec.decompress).toBe('function');
    });

    it('compress returns Uint8Array', () => {
      const input = new TextEncoder().encode('hello');
      const result = codec.compress(input);
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('decompress returns Uint8Array', () => {
      const input = new TextEncoder().encode('hello');
      const compressed = codec.compress(input);
      const result = codec.decompress(compressed);
      expect(result).toBeInstanceOf(Uint8Array);
    });
  });

  describe('text handling', () => {
    it('round-trips UTF-8 text', () => {
      const text = 'Hello World!';
      const input = new TextEncoder().encode(text);
      const compressed = codec.compress(input);
      const decompressed = codec.decompress(compressed);
      expect(new TextDecoder().decode(decompressed)).toBe(text);
    });

    it('round-trips JSON', () => {
      const obj = { key: 'value', number: 42 };
      const json = JSON.stringify(obj);
      const input = new TextEncoder().encode(json);
      const compressed = codec.compress(input);
      const decompressed = codec.decompress(compressed);
      expect(JSON.parse(new TextDecoder().decode(decompressed))).toEqual(obj);
    });

    it('round-trips UTF-8 with special characters', () => {
      const text = 'Hello 世界 🌍 émojis';
      const input = new TextEncoder().encode(text);
      const compressed = codec.compress(input);
      const decompressed = codec.decompress(compressed);
      expect(new TextDecoder().decode(decompressed)).toBe(text);
    });

    it('round-trips empty string', () => {
      const text = '';
      const input = new TextEncoder().encode(text);
      const compressed = codec.compress(input);
      const decompressed = codec.decompress(compressed);
      expect(new TextDecoder().decode(decompressed)).toBe(text);
    });
  });

  describe('compression level', () => {
    it('accepts custom compression level in constructor', () => {
      const fastCodec = new ZstdTextCompressionAdapter(1);
      const input = new TextEncoder().encode('test');
      const compressed = fastCodec.compress(input);
      const decompressed = fastCodec.decompress(compressed);
      expect(new TextDecoder().decode(decompressed)).toBe('test');
    });

    it('accepts compression level in compress call', () => {
      const input = new TextEncoder().encode('test');
      const compressed = codec.compress(input, 10);
      const decompressed = codec.decompress(compressed);
      expect(new TextDecoder().decode(decompressed)).toBe('test');
    });
  });
});

describe('Adapter comparison', () => {
  it('both adapters implement same interface', () => {
    const binaryCodec: CompressionV1 = new ZstdBinaryCompression();
    const textCodec: CompressionV1 = new ZstdTextCompressionAdapter();

    expect(typeof binaryCodec.compress).toBe('function');
    expect(typeof binaryCodec.decompress).toBe('function');
    expect(typeof textCodec.compress).toBe('function');
    expect(typeof textCodec.decompress).toBe('function');
  });

  it('both adapters handle text data correctly', () => {
    const binaryCodec = new ZstdBinaryCompression();
    const textCodec = new ZstdTextCompressionAdapter();

    const text = 'Hello, World!';
    const input = new TextEncoder().encode(text);

    const binaryCompressed = binaryCodec.compress(input);
    const binaryDecompressed = binaryCodec.decompress(binaryCompressed);

    const textCompressed = textCodec.compress(input);
    const textDecompressed = textCodec.decompress(textCompressed);

    expect(new TextDecoder().decode(binaryDecompressed)).toBe(text);
    expect(new TextDecoder().decode(textDecompressed)).toBe(text);
  });
});
