import sys

with open(r'C:\Users\Usuario\Desktop\Barberia\index.html', 'r', encoding='utf-8') as f:
    text = f.read()

idx = 96395
sys.stdout.buffer.write(text[idx-400:idx].encode('utf-8'))
