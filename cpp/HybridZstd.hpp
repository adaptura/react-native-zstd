#pragma once

#include "HybridZstdSpec.hpp"

namespace margelo::nitro::zstd {

class HybridZstd : public HybridZstdSpec {
public:
  HybridZstd() : HybridObject(TAG) {}

  // String-based API (existing)
  std::shared_ptr<ArrayBuffer> compress(const std::string& data, double compressionLevel) override;
  std::string decompress(const std::shared_ptr<ArrayBuffer>& data) override;

  // Binary-safe API (new)
  std::shared_ptr<ArrayBuffer> compressBytes(const std::shared_ptr<ArrayBuffer>& data, double compressionLevel) override;
  std::shared_ptr<ArrayBuffer> decompressBytes(const std::shared_ptr<ArrayBuffer>& data) override;
};

} // namespace margelo::nitro::zstd
