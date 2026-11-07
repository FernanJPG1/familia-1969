import sys
sys.stdout.reconfigure(encoding='utf-8')
with open('C:/Users/Usuario/Desktop/Barberia/public/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('handleMobileBookingSubmit')
if idx != -1:
    print(text[idx-50:idx+1500])
