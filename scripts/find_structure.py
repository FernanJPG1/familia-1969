import sys

with open(r'C:\Users\Usuario\Desktop\Barberia\index.html', 'r', encoding='utf-8') as f:
    text = f.read()

root_idx = text.find('id="mobile-app-root"')
print('mobile-app-root at:', root_idx)

modal_auth_idx = text.find('id="modal-auth"')
print('modal-auth at:', modal_auth_idx)

# print 500 chars before modal_auth
sys.stdout.buffer.write(b"--- 500 chars before modal-auth ---\n")
sys.stdout.buffer.write(text[modal_auth_idx-500:modal_auth_idx].encode('utf-8'))
