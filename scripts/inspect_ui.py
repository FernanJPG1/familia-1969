import sys, re
sys.stdout.reconfigure(encoding='utf-8')
with open('C:/Users/Usuario/Desktop/Barberia/public/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

print('Modals found:')
for m in re.finditer(r'id=["\'](modal[^"\']+)["\']', text):
    print('-', m.group(1))

print('\nAppointment booking functions:')
for m in re.finditer(r'function (open[a-zA-Z0-9_]*Modal|book[a-zA-Z0-9_]*|handle[a-zA-Z0-9_]*)\(', text):
    print('-', m.group(1))
