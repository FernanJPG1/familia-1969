with open(r'C:\Users\Usuario\Desktop\Barberia\index.html', 'r', encoding='utf-8') as f:
    text = f.read()

import sys
idx = text.find('id="sheet-new-booking"')
print('sheet-new-booking found at:', idx)
sys.stdout.buffer.write(text[idx:idx+800].encode('utf-8'))
