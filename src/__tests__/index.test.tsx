/**
 * Main entry point tests
 *
 * See individual test files for comprehensive tests:
 * - binary.test.ts - Binary compression API
 * - fuzz.test.ts - Random data tests
 * - backward-compat.test.ts - String API compatibility
 * - codecs.test.ts - Compression adapters
 */

// Mock the native module for unit testing
jest.mock('react-native-nitro-modules', () => ({
  NitroModules: {
    createHybridObject: () => ({
      compress: jest.fn(),
      decompress: jest.fn(),
      compressBytes: jest.fn(),
      decompressBytes: jest.fn(),
    }),
  },
}));

describe('react-native-zstd exports', () => {
  it('exports string-based compress function', async () => {
    const { compress } = await import('../index');
    expect(typeof compress).toBe('function');
  });

  it('exports string-based decompress function', async () => {
    const { decompress } = await import('../index');
    expect(typeof decompress).toBe('function');
  });

  it('exports binary compressBytes function', async () => {
    const { compressBytes } = await import('../index');
    expect(typeof compressBytes).toBe('function');
  });

  it('exports binary decompressBytes function', async () => {
    const { decompressBytes } = await import('../index');
    expect(typeof decompressBytes).toBe('function');
  });

  it('exports ZstdBinaryCompression adapter', async () => {
    const { ZstdBinaryCompression } = await import('../index');
    expect(ZstdBinaryCompression).toBeDefined();
  });

  it('exports ZstdTextCompressionAdapter adapter', async () => {
    const { ZstdTextCompressionAdapter } = await import('../index');
    expect(ZstdTextCompressionAdapter).toBeDefined();
  });
});
