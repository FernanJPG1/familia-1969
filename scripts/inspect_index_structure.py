import re

with open(r'C:\Users\Usuario\Desktop\Barberia\index.html', 'r', encoding='utf-8') as f:
    content = f.read()

print('Length of file:', len(content))
body_match = re.search(r'<body[^>]*>', content)
if body_match:
    start = body_match.start()
    print('Body tag starts at:', start)
    print(content[start:start+800])

modal_auth = re.search(r'id=["\']modal-auth["\']', content)
if modal_auth:
    m_start = modal_auth.start()
    print('\nFound modal-auth around:', m_start)
    print(content[max(0, m_start-100):m_start+400])

# Check where checkAuthOnLoad or initial load scripts are
script_auth = re.search(r'function checkAuthOnLoad', content)
if script_auth:
    s_start = script_auth.start()
    print('\nFound checkAuthOnLoad around:', s_start)
    print(content[s_start:s_start+800])
