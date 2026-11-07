with open('C:/Users/Usuario/Desktop/Barberia/public/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('async function loadDashboardData')
if idx != -1:
    print('Found loadDashboardData at', idx)
    print(text[idx:idx+1500])
