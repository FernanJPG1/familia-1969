with open(r'C:\Users\Usuario\Desktop\Barberia\index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

import sys
for i in range(6380, min(6460, len(lines))):
    sys.stdout.buffer.write(f'{i+1}: {lines[i]}'.encode('utf-8'))
