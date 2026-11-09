import sys

with open(r'C:\Users\Usuario\Desktop\Barberia\index.html', 'r', encoding='utf-8') as f:
    text = f.read()

indices = [96395, 107333, 215258, 221779, 224711]
for idx in indices:
    sys.stdout.buffer.write(f"\n--- Section around {idx} ---\n".encode('utf-8'))
    sys.stdout.buffer.write(text[idx:idx+250].encode('utf-8'))
