import subprocess

out = subprocess.check_output(['git', 'show', 'f9e097d^:index.html'], cwd='C:/Users/Usuario/Desktop/Barberia').decode('utf-8', errors='ignore')
lines = out.split('\n')
for i, l in enumerate(lines):
    if '<nav class="sidebar-nav">' in l:
        for j in range(i, min(i+60, len(lines))):
            print(lines[j])
        break
