with open(r'C:\Users\Usuario\Desktop\Barberia\index.html', 'r', encoding='utf-8') as f:
    text = f.read()

import sys
b_idx = text.find('<body>')
sys.stdout.buffer.write(text[b_idx:b_idx+350].encode('utf-8'))
