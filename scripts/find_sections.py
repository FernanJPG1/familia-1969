with open(r'C:\Users\Usuario\Desktop\Barberia\index.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re
# Look for </aside> or <main or footer
print("Finding sections:")
for m in re.finditer(r'<!--\s*==+\s*-->', text):
    start = m.start()
    snippet = text[start:start+150].replace('\n', ' ')
    print(f"At {start}: {snippet[:80]}")
