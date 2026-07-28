from pathlib import Path
import re
import struct
from collections import Counter
raw = Path('build-log.txt').read_bytes()
print('len', len(raw))
print('head', raw[:16])
print('hex', raw[:16].hex())
print('maybe ascii', raw[:64].decode('utf-8', errors='replace'))
print('common bytes', Counter(raw[:64]).most_common(20))
for name, func in [
    ('gzip', lambda d: __import__('gzip').decompress(d)),
    ('bz2', lambda d: __import__('bz2').decompress(d)),
    ('lzma', lambda d: __import__('lzma').decompress(d)),
]:
    try:
        out = func(raw)
        print('DECODED', name, len(out))
        print(out[:1000].decode('utf-8', errors='replace'))
        break
    except Exception as e:
        print('FAIL', name, type(e).__name__, e)
for wbits in [15, 31, -15, 47, -47]:
    try:
        import zlib
        out = zlib.decompress(raw, wbits=wbits)
        print('zlib ok', wbits, len(out))
        print(out[:1000].decode('utf-8', errors='replace'))
        break
    except Exception as e:
        print('zlib fail', wbits, type(e).__name__, e)
print('--- strings ---')
for m in re.finditer(rb'[\t\n\r -~]{20,}', raw):
    text = m.group(0).decode('utf-8', errors='replace')
    if any(x in text for x in ['Bundle', 'bundle', 'Metro', 'Unable', 'Cannot', 'error', 'ERROR', 'Exception', 'SyntaxError', 'Build', 'build']):
        print('FOUND', m.start())
        print(text)
        break
else:
    print('NO KEYWORDS FOUND')
    print('first string', re.findall(rb'[\t\n\r -~]{20,}', raw)[:10])
