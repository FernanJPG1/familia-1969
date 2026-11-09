with open(r'C:\Users\Usuario\Desktop\Barberia\index.html', 'r', encoding='utf-8') as f:
    text = f.read()

import sys
b_nav_idx = text.find('class="mobile-bottom-nav"')
close_nav = text.find('</nav>', b_nav_idx)
print('b_nav_idx:', b_nav_idx, 'close_nav:', close_nav)
sys.stdout.buffer.write(text[close_nav-50:close_nav+200].encode('utf-8'))
