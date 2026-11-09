with open(r'C:\Users\Usuario\Desktop\Barberia\index.html', 'r', encoding='utf-8') as f:
    text = f.read()

import sys
idx = text.find('class="desktop-topbar"')
if idx != -1:
    sys.stdout.buffer.write(text[idx:idx+1200].encode('utf-8'))
else:
    print("topbar not found")
