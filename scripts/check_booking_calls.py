with open(r'C:\Users\Usuario\Desktop\Barberia\index.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = re.findall(r'function openNewBookingSheet[^{]*\{[^}]*\}', text)
print('openNewBookingSheet:', matches)

matches2 = re.findall(r'function selectService[^{]*\{[^}]*\}', text)
print('selectService:', matches2)
