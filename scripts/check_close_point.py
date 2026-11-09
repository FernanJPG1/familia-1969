with open(r'C:\Users\Usuario\Desktop\Barberia\index.html', 'r', encoding='utf-8') as f:
    text = f.read()

import sys
sys.stdout.buffer.write(text[96300:96500].encode('utf-8'))
