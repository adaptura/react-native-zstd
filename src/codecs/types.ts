/**
 * Codec for encoding/decoding arbitrary objects to/from bytes.
 * Implementations might use JSON, MessagePack, Protobuf, CBOR, etc.
 */
export interface BlobCodecV1 {
  /**
   * Encode an object to bytes
   * @throws if the object cannot be serialized
   */
  encode(obj: unknown): Uint8Array;

  /**
   * Decode bytes back to an object
   * @throws if the bytes are invalid or corrupted
   */
  decode(bytes: Uint8Array): unknown;
}

/**
 * Compression codec for compressing/decompressing byte arrays.
 */
export interface CompressionV1 {
  /**
   * Compress bytes
   * @param bytes - raw bytes to compress
   * @param level - compression level (implementation-specific)
   * @returns compressed bytes
   */
  compress(bytes: Uint8Array, level?: number): Uint8Array;

  /**
   * Decompress bytes
   * @param bytes - compressed bytes
   * @returns original uncompressed bytes
   * @throws if decompression fails
   */
  decompress(bytes: Uint8Array): Uint8Array;
}
