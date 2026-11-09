with open(r'C:\Users\Usuario\Desktop\Barberia\index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's count tags or check end of body
body_idx = text.find('<body>')
print("Body starts at:", body_idx)
# Let's see the last 1500 characters of the file
import sys
sys.stdout.buffer.write(text[-1500:].encode('utf-8'))
