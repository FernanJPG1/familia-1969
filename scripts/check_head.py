with open(r'C:\Users\Usuario\Desktop\Barberia\index.html', 'r', encoding='utf-8') as f:
    text = f.read()

head_idx = text.find('</head>')
print('</head> is at:', head_idx)
import sys
sys.stdout.buffer.write(text[head_idx-300:head_idx+7].encode('utf-8'))
