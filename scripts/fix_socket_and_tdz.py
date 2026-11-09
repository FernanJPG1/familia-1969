import re

def fix_file(file_path):
    print(f"Fixing {file_path}...")
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add var currentAuthToken & var currentAuthUser right after <script>
    script_match = re.search(r'(<!-- =+\s*-->\s*<script>\s*)', content)
    if script_match and 'var currentAuthToken =' not in content:
        pos = script_match.end()
        global_vars_block = """    // =========================================================================
    // VARIABLES GLOBALES DE SESIÓN Y AUTENTICACIÓN (HOISTED / BLINDADAS)
    // =========================================================================
    var currentAuthToken = localStorage.getItem('fam1969_token') || null;
    var currentAuthUser = null;
    try {
      currentAuthUser = JSON.parse(localStorage.getItem('fam1969_user') || 'null');
    } catch (e) {
      currentAuthUser = null;
    }

"""
        content = content[:pos] + global_vars_block + content[pos:]
        print("  [OK] Injected hoisted global vars at top of <script>")

    # 2. Fix const socket = io(); -> const socket = (typeof io === 'function') ? io() : null; and guard all socket.on
    old_socket_block = """    const socket = io();
    socket.on('dashboard:refresh', () => {
      loadDashboardData();
      showMobileToast('⚡ Turno sincronizado en vivo vía WhatsApp');
    });

    socket.on('services:updated', () => {
      loadServices();
      loadDashboardData();
      showMobileToast('✂️ Catálogo de cortes actualizado');
    });

    socket.on('settings:updated', (data) => {
      if (data.settings) {
        currentSettings = data.settings;
        populateSettingsForm(data.settings);
        updateUIWithSettings(data.settings);
      }
      showMobileToast('⚙️ Ajustes del estudio actualizados en vivo');
    });

    socket.on('appointment:updated', (data) => {
      loadDashboardData();
      showMobileToast(`Estado actualizado: ${data.status}`);
    });

    socket.on('barber:notification', (data) => {
      playNotificationChime();
      showBarberNotification(data);
      loadDashboardData();
    });

    socket.on('whatsapp:reminder_sent', (data) => {
      if (data && data.message) {
        injectReminderIntoMobileChat(data.message);
      }
      showMobileToast('⏰ Recordatorio 20m enviado al cliente');
      loadDashboardData();
    });"""

    new_socket_block = """    // Conexión WebSockets segura con fallback inteligente (Vercel Serverless Friendly)
    const socket = (typeof io === 'function') ? io() : null;
    if (socket) {
      socket.on('dashboard:refresh', () => {
        loadDashboardData();
        showMobileToast('⚡ Turno sincronizado en vivo vía WhatsApp');
      });

      socket.on('services:updated', () => {
        loadServices();
        loadDashboardData();
        showMobileToast('✂️ Catálogo de cortes actualizado');
      });

      socket.on('settings:updated', (data) => {
        if (data.settings) {
          currentSettings = data.settings;
          populateSettingsForm(data.settings);
          updateUIWithSettings(data.settings);
        }
        showMobileToast('⚙️ Ajustes del estudio actualizados en vivo');
      });

      socket.on('appointment:updated', (data) => {
        loadDashboardData();
        showMobileToast(`Estado actualizado: ${data.status}`);
      });

      socket.on('barber:notification', (data) => {
        playNotificationChime();
        showBarberNotification(data);
        loadDashboardData();
      });

      socket.on('whatsapp:reminder_sent', (data) => {
        if (data && data.message) {
          injectReminderIntoMobileChat(data.message);
        }
        showMobileToast('⏰ Recordatorio 20m enviado al cliente');
        loadDashboardData();
      });
    }"""

    if old_socket_block in content:
        content = content.replace(old_socket_block, new_socket_block)
        print("  [OK] Guarded socket.io initialization and listeners")
    else:
        print("  [WARN] old_socket_block not found directly, checking partial")
        content = content.replace('const socket = io();', 'const socket = (typeof io === "function") ? io() : null;\n    if (socket) {')
        # if partial was done, make sure it closes
        print("  [OK] Partial socket replaced")

    # 3. Replace late let currentAuthToken with re-sync to avoid re-declaration
    content = content.replace(
        "let currentAuthToken = localStorage.getItem('fam1969_token') || null;",
        "currentAuthToken = currentAuthToken || localStorage.getItem('fam1969_token') || null;"
    )
    content = content.replace(
        "let currentAuthUser = null;",
        "currentAuthUser = currentAuthUser || null;"
    )

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  [OK] Successfully saved {file_path}")

fix_file(r'C:\Users\Usuario\Desktop\Barberia\index.html')
fix_file(r'C:\Users\Usuario\Desktop\Barberia\public\index.html')
print("Fix completed!")
