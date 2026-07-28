from pathlib import Path
import re

path = Path('eas-build-2837767b.log')
text = path.read_text(encoding='utf-8', errors='replace')
print('FILE', path, 'LENGTH', len(text))

keywords = [
    'Bundle JavaScript',
    'Unable to resolve',
    'Cannot find module',
    'Metro',
    'ERROR',
    'Failed',
    'Exception',
    'SyntaxError',
    'error',
    'build phase',
    'Bundling failed',
    'TransformError',
    'Module not found',
]

for kw in keywords:
    for m in re.finditer(re.escape(kw), text, re.IGNORECASE):
        start = max(0, m.start() - 200)
        end = min(len(text), m.end() + 400)
        print('\n=== KEYWORD:', kw, 'MATCH AT', m.start(), '===\n')
        print(text[start:end])
        print('\n---\n')
        raise SystemExit(0)

print('NO KEYWORDS FOUND')
