with open(r'C:\Users\Usuario\Desktop\Barberia\index.html', 'r', encoding='utf-8') as f:
    text = f.read()

body_start = text.find('<body>') + len('<body>')
first_script = text.find('<script', body_start)

# Count divs up to first script
sub = text[body_start:first_script]
opens = sub.count('<div')
closes = sub.count('</div')
print(f"Between body and first script: opens={opens}, closes={closes}")

# Let's check between first script and modal-auth
modal_auth = text.find('id="modal-auth"')
sub2 = text[first_script:modal_auth]
print(f"Between first script and modal-auth: opens={sub2.count('<div')}, closes={sub2.count('</div')}")
