with open(r'C:\Users\Usuario\Desktop\Barberia\index.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = list(re.finditer(r'(?:let|var|const)\s+currentAuthToken\b', text))
print(f'Total declarations: {len(matches)}')
for m in matches:
    start = m.start()
    line_no = text[:start].count('\n') + 1
    print(f'Line {line_no}: {text[start:start+60]}')
