with open('C:/Users/Usuario/Desktop/Barberia/public/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('topbar-auth-container')
if idx != -1:
    print('--- MATCH ---')
    print(text[idx-50:idx+800])
