with open(r'C:\Users\Usuario\Desktop\Barberia\index.html', 'r', encoding='utf-8') as f:
    text = f.read()

import sys
idx = text.find('<!-- MODALES DE ESCRITORIO')
sys.stdout.buffer.write(text[idx-200:idx+100].encode('utf-8'))
