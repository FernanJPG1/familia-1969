with open(r'C:\Users\Usuario\Desktop\Barberia\index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's find </body>
body_close = text.rfind('</body>')
print('body_close at:', body_close)
print('Total length:', len(text))
print('Tail after modal-auth:')
import sys
sys.stdout.buffer.write(text[text.rfind('<script'):text.rfind('<script')+500].encode('utf-8'))
