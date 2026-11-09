import sys
sys.stdout.reconfigure(encoding='utf-8')

# 1. Update public/index.html and index.html
def optimize_html(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Remove blocking socket.io script from head
    old_head_socket = '  <!-- Socket.io Client -->\n  <script src="/socket.io/socket.io.js"></script>'
    new_head_socket = '  <!-- Socket.io Client (Carga asíncrona no bloqueante) -->\n  <script>\n    window.socket = { on: function(){}, emit: function(){} };\n  </script>'

    if old_head_socket in content:
        content = content.replace(old_head_socket, new_head_socket)
        print(f'Replaced blocking socket script in {file_path}')

    # Add id="btn-submit-login" to login submit button
    old_login_btn = '<button type="submit" style="width: 100%; height: 44px; background: linear-gradient(135deg, #38BDF8 0%, #2563EB 50%, #1D4ED8 100%); border: none; border-radius: 10px; color: #FFF; font-weight: 800; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 6px;">\n          <i class="fa-solid fa-arrow-right-to-bracket"></i> Ingresar al Panel de Barbero\n        </button>'
    new_login_btn = '<button type="submit" id="btn-submit-login" style="width: 100%; height: 44px; background: linear-gradient(135deg, #38BDF8 0%, #2563EB 50%, #1D4ED8 100%); border: none; border-radius: 10px; color: #FFF; font-weight: 800; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 6px;">\n          <i class="fa-solid fa-arrow-right-to-bracket"></i> Iniciar Sesión\n        </button>'

    if old_login_btn in content:
        content = content.replace(old_login_btn, new_login_btn)
        print(f'Added id to login submit button in {file_path}')

    # Add id="btn-submit-register" to register submit button
    old_reg_btn = '<button type="submit" style="width: 100%; height: 44px; background: linear-gradient(135deg, #38BDF8 0%, #2563EB 50%, #1D4ED8 100%); border: none; border-radius: 10px; color: #FFF; font-weight: 800; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 6px;">\n          <i class="fa-solid fa-user-plus"></i> Crear Cuenta de Barbero\n        </button>'
    new_reg_btn = '<button type="submit" id="btn-submit-register" style="width: 100%; height: 44px; background: linear-gradient(135deg, #38BDF8 0%, #2563EB 50%, #1D4ED8 100%); border: none; border-radius: 10px; color: #FFF; font-weight: 800; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 6px;">\n          <i class="fa-solid fa-user-plus"></i> Crear Cuenta de Barbero\n        </button>'

    if old_reg_btn in content:
        content = content.replace(old_reg_btn, new_reg_btn)
        print(f'Added id to register submit button in {file_path}')

    # Replace handleBarberLogin with instant-feedback version
    old_login_fn_start = content.find('async function handleBarberLogin(e)')
    if old_login_fn_start != -1:
        old_login_fn_end = content.find('async function handleBarberRegister(e)', old_login_fn_start)
        new_login_fn = '''async function handleBarberLogin(e) {
      e.preventDefault();
      hideAuthPendingAlert();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const btn = document.getElementById('btn-submit-login');

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Ingresando...';
      }

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        
        if (!res.ok) {
          if (data.isPending) {
            showAuthPendingAlert(data.error);
            return;
          }
          throw new Error(data.error || 'Error al iniciar sesión');
        }

        // Acceso instantáneo sin esperas perceptibles
        setAuthSession(data.token, data.user);
        closeAuthModal();
        showMobileToast(`✨ Bienvenido, ${data.user.name} (${data.user.role === 'admin' ? 'Administrador' : 'Barbero'})`);
        
        // Carga de datos en segundo plano
        loadDashboardData();
        loadSettings();

        if (data.user.role === 'admin') {
          checkPendingBarbersCount();
        }
      } catch (err) {
        alert(err.message);
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i> Iniciar Sesión';
        }
      }
    }

    '''
        content = content[:old_login_fn_start] + new_login_fn + content[old_login_fn_end:]
        print(f'Optimized handleBarberLogin in {file_path}')

    # Replace socket = io() block with safe non-blocking version
    old_socket_block_start = content.find('const socket = io();')
    if old_socket_block_start != -1:
        old_socket_block_end = content.find('// ======================================================================\n    // FUNCIONES DEL SIMULADOR DE WHATSAPP', old_socket_block_start)
        if old_socket_block_end == -1:
            old_socket_block_end = content.find('// ======================================================================\r\n    // FUNCIONES DEL SIMULADOR DE WHATSAPP', old_socket_block_start)
        
        if old_socket_block_end != -1:
            new_socket_block = '''let socket = window.socket || { on: function(){}, emit: function(){} };

    function attachSocketListeners(s) {
      if (!s || !s.on) return;
      s.on('dashboard:refresh', () => {
        loadDashboardData();
        showMobileToast('⚡ Turno sincronizado en vivo vía WhatsApp');
      });
      s.on('services:updated', () => {
        loadServices();
        loadDashboardData();
        showMobileToast('✂️ Catálogo de cortes actualizado');
      });
      s.on('settings:updated', (data) => {
        if (data.settings) {
          currentSettings = data.settings;
          populateSettingsForm(data.settings);
          updateUIWithSettings(data.settings);
        }
        showMobileToast('⚙️ Ajustes del estudio actualizados en vivo');
      });
      s.on('appointment:updated', (data) => {
        loadDashboardData();
        showMobileToast(`Estado actualizado: ${data.status}`);
      });
      s.on('barber:notification', (data) => {
        showBarberArrivalNotification(data);
      });
      s.on('whatsapp:reminder_sent', (data) => {
        showMobileToast(`⏰ Recordatorio enviado a ${data.clientName}`);
      });
    }

    // Carga Socket.io dinámico solo en localhost para no bloquear Vercel
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      try {
        const sc = document.createElement('script');
        sc.src = '/socket.io/socket.io.js';
        sc.onload = () => {
          try {
            if (typeof io !== 'undefined') {
              socket = io();
              attachSocketListeners(socket);
            }
          } catch(e) {}
        };
        document.head.appendChild(sc);
      } catch(e) {}
    } else {
      // En la nube: Polling inteligente cada 12 segundos cuando la pestaña está visible
      setInterval(() => {
        if (document.visibilityState === 'visible') {
          loadDashboardData();
        }
      }, 12000);
    }

    '''
            content = content[:old_socket_block_start] + new_socket_block + content[old_socket_block_end:]
            print(f'Optimized socket block in {file_path}')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Successfully wrote optimized {file_path}')

optimize_html('C:/Users/Usuario/Desktop/Barberia/public/index.html')
optimize_html('C:/Users/Usuario/Desktop/Barberia/index.html')

# 2. Update ensureDefaultUsers in store.ts to upgrade password hashes
with open('C:/Users/Usuario/Desktop/Barberia/src/database/store.ts', 'r', encoding='utf-8') as f:
    store_code = f.read()

store_code = store_code.replace(
    '''    } else {
      admin.role = 'admin';
      admin.status = 'active';
      admin.isActive = true;
    }''',
    '''    } else {
      admin.role = 'admin';
      admin.status = 'active';
      admin.isActive = true;
      if (!admin.passwordHash.startsWith('v2:')) {
        admin.passwordHash = CryptoUtils.hashPassword('FamiliaAdmin1969*');
      }
    }'''
)

store_code = store_code.replace(
    '''    } else {
      masterBarber.role = 'barber';
      masterBarber.status = 'active';
      masterBarber.isActive = true;
      if (!masterBarber.barberId) masterBarber.barberId = 'barber-1';
    }''',
    '''    } else {
      masterBarber.role = 'barber';
      masterBarber.status = 'active';
      masterBarber.isActive = true;
      if (!masterBarber.barberId) masterBarber.barberId = 'barber-1';
      if (!masterBarber.passwordHash.startsWith('v2:')) {
        masterBarber.passwordHash = CryptoUtils.hashPassword('Familia1969*');
      }
    }'''
)

with open('C:/Users/Usuario/Desktop/Barberia/src/database/store.ts', 'w', encoding='utf-8') as f:
    f.write(store_code)
print('Updated store.ts with fast v2 hashes!')

# 3. Update vercel.json with cache headers
vercel_json = '''{
  "version": 2,
  "redirects": [
    { "source": "/", "destination": "/index.html", "permanent": false }
  ],
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.js" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/index.html",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }
      ]
    }
  ]
}
'''
with open('C:/Users/Usuario/Desktop/Barberia/vercel.json', 'w', encoding='utf-8') as f:
    f.write(vercel_json)
print('Updated vercel.json with performance headers!')
