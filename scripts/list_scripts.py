with open(r'C:\Users\Usuario\Desktop\Barberia\index.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = list(re.finditer(r'<script\b[^>]*>', text))
print(f'Total script tags: {len(matches)}')
for i, m in enumerate(matches):
    start = m.start()
    end = text.find('</script>', start)
    line_start = text[:start].count('\n') + 1
    line_end = text[:end].count('\n') + 1
    print(f'Script {i+1}: lines {line_start} to {line_end}')
