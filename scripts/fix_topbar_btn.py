import re

btn_html = """          <!-- Botón de Conmutación a Landing / Club -->
          <button class="desktop-btn desktop-btn-surface" onclick="showLandingView()" title="Ver Presentación / Conocer Más de FAMILIA 1969" style="border-color: rgba(56, 189, 248, 0.4); background: rgba(14, 23, 44, 0.9);">
            <i class="fa-solid fa-compass" style="color: #38BDF8;"></i>
            <span class="btn-text-full">Club / Landing</span>
          </button>
"""

for path in [r'C:\Users\Usuario\Desktop\Barberia\index.html', r'C:\Users\Usuario\Desktop\Barberia\public\index.html']:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '<span class="btn-text-full">Club / Landing</span>' not in content:
        target = '<div class="topbar-actions">'
        idx = content.find(target)
        if idx != -1:
            content = content[:idx + len(target)] + '\n' + btn_html + content[idx + len(target):]
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"[OK] Added Club / Landing button to {path}")
    else:
        print(f"Club / Landing button already in {path}")
