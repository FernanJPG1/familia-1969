with open('C:/Users/Usuario/Desktop/Barberia/public/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('function renderServices(')
if idx != -1:
    print('Found renderServices at', idx)
    print(text[idx-200:idx+600])
