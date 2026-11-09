with open(r'C:\Users\Usuario\Desktop\Barberia\index.html', 'r', encoding='utf-8') as f:
    text = f.read()

import sys
idx = text.find('class="desktop-topbar"')
idx2 = text.find('</header>', idx)
sys.stdout.buffer.write(text[idx:idx2+9].encode('utf-8'))
