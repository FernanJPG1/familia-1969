import sys
sys.stdout.reconfigure(encoding='utf-8')
with open('C:/Users/Usuario/Desktop/Barberia/public/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('async function handleMobileBookingSubmit')
if idx != -1:
    print(text[idx:idx+1500])
