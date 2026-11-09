with open(r'C:\Users\Usuario\Desktop\Barberia\index.html', 'r', encoding='utf-8') as f:
    text = f.read()

import sys
nav_idx = text.find('</nav>')
sys.stdout.buffer.write(text[nav_idx-100:nav_idx+200].encode('utf-8'))
