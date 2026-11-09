with open(r'C:\Users\Usuario\Desktop\Barberia\index.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = re.findall(r'CAPÍTULO\s*0[1-4][^<]*', text)
print("Found chapter headers:", matches)
