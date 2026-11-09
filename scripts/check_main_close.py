with open(r'C:\Users\Usuario\Desktop\Barberia\index.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = [m.start() for m in re.finditer(r'</div', text)]
print('Total </div> count:', len(matches))
# Let's search for </aside>, </main>, </div>
main_close = text.find('</main>')
print('main_close at:', main_close)
import sys
sys.stdout.buffer.write(text[main_close:main_close+500].encode('utf-8'))
