# Test script to verify injection points in index.html
with open(r'C:\Users\Usuario\Desktop\Barberia\index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Check insertion point 1: CSS before </head>
head_close = html.find('</head>')
print('1. Head close at:', head_close)

# Check insertion point 2: Landing HTML right after <body>
body_open = html.find('<body>') + len('<body>')
print('2. Body open at:', body_open)

# Check insertion point 3: Wrap app layout
# Mobile app root start
app_root_start = html.find('<!-- CONTENEDOR PRINCIPAL: SISTEMA WEB DE GESTIÓN (SAAS DESKTOP) -->')
print('3. App root comment start at:', app_root_start)

# Mobile bottom nav end
bottom_nav_idx = html.find('class="mobile-bottom-nav"')
bottom_nav_close = html.find('</nav>', bottom_nav_idx) + len('</nav>')
print('4. Bottom nav close at:', bottom_nav_close)

# Check insertion point 4: Topbar button
topbar_actions_idx = html.find('class="topbar-actions"')
print('5. Topbar actions at:', topbar_actions_idx)

# Check insertion point 5: Sidebar button
sidebar_nav_close = html.find('</nav>', html.find('class="sidebar-nav"'))
print('6. Sidebar nav close at:', sidebar_nav_close)

# Check insertion point 6: JS logic in scripts
auth_load_idx = html.find('async function checkAuthOnLoad()')
print('7. checkAuthOnLoad at:', auth_load_idx)
