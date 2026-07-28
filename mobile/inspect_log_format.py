from pathlib import Path
import struct
import binascii

path = Path('eas-build-2837767b.log')
data = path.read_bytes()
print('Length:', len(data))
print('Header:', data[:16].hex())
print('First 32 bytes:', data[:32])
print('ASCII snippet:', ''.join(chr(b) if 32 <= b < 127 else '.' for b in data[:128]))

signatures = {
    'gzip': b'\x1f\x8b',
    'zip': b'PK\x03\x04',
    'xls': b'PK\x03\x04',
    'pdf': b'%PDF',
    'bz2': b'BZh',
    'xz': b'\xfd7zXZ',
    'lzma': b'\x5d\x00\x00\x80',
    'zstd': b'\x28\xb5\x2f\xfd',
    'brotli': b'\xce\xb2\xcf\x81',
}
for name, sig in signatures.items():
    print(name, data.startswith(sig))

try:
    import gzip
    print('gzip ok', len(gzip.decompress(data)))
except Exception as e:
    print('gzip fail', type(e).__name__, e)

try:
    import bz2
    print('bz2 ok', len(bz2.decompress(data)))
except Exception as e:
    print('bz2 fail', type(e).__name__, e)

try:
    import lzma
    print('lzma ok', len(lzma.decompress(data)))
except Exception as e:
    print('lzma fail', type(e).__name__, e)

try:
    import zstandard as zstd
    d = zstd.ZstdDecompressor()
    out = d.decompress(data)
    print('zstd ok', len(out))
except Exception as e:
    print('zstd fail', type(e).__name__, e)

try:
    import brotli
    out = brotli.decompress(data)
    print('brotli ok', len(out))
except Exception as e:
    print('brotli fail', type(e).__name__, e)

try:
    import codecs
    print('utf-8 decode ok first 200', data[:200].decode('utf-8'))
except Exception as e:
    print('utf-8 fail', type(e).__name__, e)
