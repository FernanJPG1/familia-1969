import sys
sys.stdout.reconfigure(encoding='utf-8')
with open('C:/Users/Usuario/Desktop/Barberia/public/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('id="topbar-auth-container"')
if idx != -1:
    print('--- TOPBAR AUTH ---')
    print(text[idx-50:idx+800])

idx2 = text.find('id="modal-auth"')
if idx2 != -1:
    print('--- MODAL AUTH ---')
    print(text[idx2-50:idx2+1200])
