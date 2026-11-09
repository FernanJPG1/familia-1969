with open(r'C:\Users\Usuario\Desktop\Barberia\index.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = re.findall(r'(\.web-app-layout\s*\{[^}]*\})', text)
for m in matches[:5]:
    print('Rule:', m[:200])

matches2 = re.findall(r'(body\s*\{[^}]*\})', text)
for m in matches2[:3]:
    print('Body Rule:', m[:200])
