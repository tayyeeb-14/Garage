from pathlib import Path
import re

path = Path('eas-build-2837767b.log')
raw = path.read_bytes()
print('file', path.name, 'len', len(raw))
print('header', raw[:16].hex())
print('ascii head', ''.join(chr(b) if 32 <= b < 127 else '.' for b in raw[:120]))

strings = re.findall(rb'[ -~]{30,}', raw)
print('string count', len(strings))
for i, s in enumerate(strings[:100]):
    text = s.decode('ascii', errors='replace')
    if any(k in text for k in ['Bundle', 'bundle', 'Metro', 'Unable', 'Cannot', 'ERROR', 'Failed', 'SyntaxError', 'TransformError', 'Module not found', 'bundling', 'Cannot', 'No such file', 'unexpected']):
        print('--- match', i, '---')
        print(text)
        print()
    elif i < 20:
        print('--- sample', i, '---')
        print(text)
        print()
