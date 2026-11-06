import os

def update():
    path_public = r'C:\Users\Usuario\Desktop\Barberia\public\index.html'
    path_root = r'C:\Users\Usuario\Desktop\Barberia\index.html'

    with open(path_public, 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. Topbar Auth Button
    auth_html = '''        <!-- Control de Acceso Barbero & WhatsApp Rápido -->
        <div id="topbar-auth-container" style="display: flex; align-items: center; gap: 6px;">
          <button id="btn-barber-login" class="desktop-btn desktop-btn-surface" onclick="openAuthModal('login')" style="border-color: rgba(59, 130, 246, 0.5); background: rgba(14, 23, 44, 0.9);">
            <i class="fa-solid fa-lock" style="color: #38BDF8;"></i>
            <span class="btn-text-full">Acceso Barbero</span><span class="btn-text-short">Login</span>
          </button>
          
          <div id="barber-logged-box" style="display: none; align-items: center; gap: 6px;">
            <button class="desktop-btn desktop-btn-surface" onclick="openQuickPhoneModal()" title="Clic para cambiar mi WhatsApp de atención" style="background: rgba(37, 99, 235, 0.18); border-color: #3B82F6; color: #FFF;">
              <i class="fa-brands fa-whatsapp" style="color: #25D366; font-size: 15px;"></i>
              <span id="topbar-phone-display" style="font-weight: 700; font-family: monospace;">+57 300...</span>
            </button>
            <button class="topbar-icon-btn" onclick="logoutBarber()" title="Cerrar Sesión de Barbero" style="color: #EF4444; border-color: rgba(239, 68, 68, 0.3);">
              <i class="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
        </div>
'''

    target_header = '<div class="topbar-actions">'
    if 'id="topbar-auth-container"' not in html:
        html = html.replace(target_header, target_header + '\n' + auth_html)

    # 2. Modals HTML
    modals_html = '''  <!-- ====================================================================== -->
  <!-- MODAL: LOGIN Y REGISTRO DE BARBERO CON SEGURIDAD Y PRIVACIDAD          -->
  <!-- ====================================================================== -->
  <div id="modal-auth" class="valmont-modal-backdrop" style="display: none; position: fixed; inset: 0; background: rgba(3, 7, 18, 0.85); backdrop-filter: blur(8px); z-index: 9999; justify-content: center; align-items: center; padding: 20px;">
    <div style="background: #0B1326; border: 1.5px solid rgba(59, 130, 246, 0.4); border-radius: 20px; width: 100%; max-width: 440px; box-shadow: 0 25px 60px rgba(0,0,0,0.8); overflow: hidden;">
      <div style="padding: 24px 24px 16px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; background: radial-gradient(circle at top, rgba(37,99,235,0.2) 0%, transparent 80%);">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 38px; height: 38px; border-radius: 50%; background: #060912; border: 1.5px solid #38BDF8; display: flex; align-items: center; justify-content: center;">
            <i class="fa-solid fa-shield-halved" style="color: #38BDF8; font-size: 16px;"></i>
          </div>
          <div>
            <h3 style="font-size: 16px; font-weight: 800; color: #FFF; font-family: 'Outfit', sans-serif;">Panel de Barbero Seguro</h3>
            <p style="font-size: 11px; color: #94A3B8;">Privacidad y Protección de Datos FAMILIA 1969</p>
          </div>
        </div>
        <button onclick="closeAuthModal()" style="background: transparent; border: none; color: #94A3B8; font-size: 24px; cursor: pointer; padding: 4px;">&times;</button>
      </div>

      <!-- Selector de Pestaña: Login / Registro -->
      <div style="display: flex; border-bottom: 1px solid rgba(255,255,255,0.08); background: #080D1A;">
        <button id="tab-auth-login-btn" onclick="switchAuthTab('login')" style="flex: 1; padding: 12px; background: transparent; border: none; border-bottom: 2px solid #3B82F6; color: #FFF; font-weight: 700; font-size: 13px; cursor: pointer;">Iniciar Sesión</button>
        <button id="tab-auth-register-btn" onclick="switchAuthTab('register')" style="flex: 1; padding: 12px; background: transparent; border: none; border-bottom: 2px solid transparent; color: #94A3B8; font-weight: 700; font-size: 13px; cursor: pointer;">Registrar Cuenta</button>
      </div>

      <!-- Formulario Login -->
      <form id="form-auth-login" onsubmit="handleBarberLogin(event)" style="padding: 24px; display: flex; flex-direction: column; gap: 16px;">
        <div>
          <label style="display: block; font-size: 12px; font-weight: 700; color: #94A3B8; margin-bottom: 6px;">Correo Electrónico</label>
          <input type="email" id="login-email" required placeholder="barbero@familia1969.com" style="width: 100%; height: 42px; background: #060912; border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 0 14px; color: #FFF; font-size: 13px; outline: none;">
        </div>
        <div>
          <label style="display: block; font-size: 12px; font-weight: 700; color: #94A3B8; margin-bottom: 6px;">Contraseña</label>
          <input type="password" id="login-password" required placeholder="••••••••" style="width: 100%; height: 42px; background: #060912; border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 0 14px; color: #FFF; font-size: 13px; outline: none;">
        </div>
        <button type="submit" style="width: 100%; height: 44px; background: linear-gradient(135deg, #38BDF8 0%, #2563EB 50%, #1D4ED8 100%); border: none; border-radius: 10px; color: #FFF; font-weight: 800; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 6px;">
          <i class="fa-solid fa-arrow-right-to-bracket"></i> Ingresar al Panel de Barbero
        </button>
      </form>

      <!-- Formulario Registro -->
      <form id="form-auth-register" onsubmit="handleBarberRegister(event)" style="padding: 24px; display: none; flex-direction: column; gap: 14px;">
        <div>
          <label style="display: block; font-size: 12px; font-weight: 700; color: #94A3B8; margin-bottom: 6px;">Nombre Completo del Barbero</label>
          <input type="text" id="reg-name" required placeholder="Ej: Jensy Gomez" style="width: 100%; height: 40px; background: #060912; border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 0 14px; color: #FFF; font-size: 13px; outline: none;">
        </div>
        <div>
          <label style="display: block; font-size: 12px; font-weight: 700; color: #38BDF8; margin-bottom: 6px;"><i class="fa-brands fa-whatsapp" style="color: #25D366;"></i> Número de WhatsApp Oficial</label>
          <input type="tel" id="reg-phone" required placeholder="+57 300 123 4567" style="width: 100%; height: 40px; background: #060912; border: 1.5px solid #2563EB; border-radius: 10px; padding: 0 14px; color: #FFF; font-size: 14px; font-family: monospace; outline: none;">
        </div>
        <div>
          <label style="display: block; font-size: 12px; font-weight: 700; color: #94A3B8; margin-bottom: 6px;">Correo Electrónico</label>
          <input type="email" id="reg-email" required placeholder="tu-email@gmail.com" style="width: 100%; height: 40px; background: #060912; border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 0 14px; color: #FFF; font-size: 13px; outline: none;">
        </div>
        <div>
          <label style="display: block; font-size: 12px; font-weight: 700; color: #94A3B8; margin-bottom: 6px;">Contraseña Segura (Mínimo 6 caracteres)</label>
          <input type="password" id="reg-password" minlength="6" required placeholder="••••••••" style="width: 100%; height: 40px; background: #060912; border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 0 14px; color: #FFF; font-size: 13px; outline: none;">
        </div>
        <button type="submit" style="width: 100%; height: 44px; background: linear-gradient(135deg, #38BDF8 0%, #2563EB 50%, #1D4ED8 100%); border: none; border-radius: 10px; color: #FFF; font-weight: 800; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 6px;">
          <i class="fa-solid fa-user-plus"></i> Crear Cuenta de Barbero
        </button>
      </form>
    </div>
  </div>

  <!-- ====================================================================== -->
  <!-- MODAL RÁPIDO: CAMBIAR NÚMERO DE WHATSAPP OFICIAL                       -->
  <!-- ====================================================================== -->
  <div id="modal-quick-phone" class="valmont-modal-backdrop" style="display: none; position: fixed; inset: 0; background: rgba(3, 7, 18, 0.85); backdrop-filter: blur(8px); z-index: 9999; justify-content: center; align-items: center; padding: 20px;">
    <div style="background: #0B1326; border: 1.5px solid rgba(59, 130, 246, 0.4); border-radius: 20px; width: 100%; max-width: 420px; box-shadow: 0 25px 60px rgba(0,0,0,0.8); overflow: hidden;">
      <div style="padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; background: radial-gradient(circle at top, rgba(37,99,235,0.2) 0%, transparent 80%);">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: #060912; border: 1.5px solid #25D366; display: flex; align-items: center; justify-content: center;">
            <i class="fa-brands fa-whatsapp" style="color: #25D366; font-size: 18px;"></i>
          </div>
          <div>
            <h3 style="font-size: 15px; font-weight: 800; color: #FFF;">Mi Número de WhatsApp</h3>
            <p style="font-size: 11px; color: #94A3B8;">Actualización inmediata en toda la app</p>
          </div>
        </div>
        <button onclick="closeQuickPhoneModal()" style="background: transparent; border: none; color: #94A3B8; font-size: 24px; cursor: pointer;">&times;</button>
      </div>

      <form onsubmit="handleSaveQuickPhone(event)" style="padding: 24px; display: flex; flex-direction: column; gap: 16px;">
        <div>
          <label style="display: block; font-size: 12px; font-weight: 700; color: #94A3B8; margin-bottom: 6px;">Número Telefónico / WhatsApp Oficial</label>
          <input type="tel" id="quick-phone-input" required placeholder="+57 300 123 4567" style="width: 100%; height: 46px; background: #060912; border: 1.5px solid #3B82F6; border-radius: 10px; padding: 0 16px; color: #FFF; font-size: 16px; font-weight: 700; font-family: monospace; outline: none;">
          <p style="font-size: 11px; color: #94A3B8; margin-top: 6px;">Este número recibirá todas las citas del bot, recordatorios automáticos y mensajes de clientes.</p>
        </div>

        <button type="submit" style="width: 100%; height: 44px; background: linear-gradient(135deg, #10B981 0%, #059669 100%); border: none; border-radius: 10px; color: #FFF; font-weight: 800; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <i class="fa-solid fa-floppy-disk"></i> Guardar Número en el Sistema
        </button>
      </form>
    </div>
  </div>
'''

    if 'id="modal-auth"' not in html:
        html = html.replace('</body>', modals_html + '\n</body>')

    # 3. JavaScript Auth Management
    js_auth = '''    // ======================================================================
    // GESTIÓN DE AUTENTICACIÓN, PRIVACIDAD Y TELÉFONO DE WHATSAPP
    // ======================================================================
    let currentAuthUser = null;
    let currentAuthToken = localStorage.getItem('fam1969_token') || null;

    function openAuthModal(tab = 'login') {
      const m = document.getElementById('modal-auth');
      if (m) m.style.display = 'flex';
      switchAuthTab(tab);
    }

    function closeAuthModal() {
      const m = document.getElementById('modal-auth');
      if (m) m.style.display = 'none';
    }

    function switchAuthTab(tab) {
      const formLogin = document.getElementById('form-auth-login');
      const formReg = document.getElementById('form-auth-register');
      const btnLogin = document.getElementById('tab-auth-login-btn');
      const btnReg = document.getElementById('tab-auth-register-btn');

      if (tab === 'login') {
        if (formLogin) formLogin.style.display = 'flex';
        if (formReg) formReg.style.display = 'none';
        if (btnLogin) { btnLogin.style.borderBottom = '2px solid #3B82F6'; btnLogin.style.color = '#FFF'; }
        if (btnReg) { btnReg.style.borderBottom = '2px solid transparent'; btnReg.style.color = '#94A3B8'; }
      } else {
        if (formLogin) formLogin.style.display = 'none';
        if (formReg) formReg.style.display = 'flex';
        if (btnReg) { btnReg.style.borderBottom = '2px solid #3B82F6'; btnReg.style.color = '#FFF'; }
        if (btnLogin) { btnLogin.style.borderBottom = '2px solid transparent'; btnLogin.style.color = '#94A3B8'; }
      }
    }

    async function handleBarberLogin(e) {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');

        setAuthSession(data.token, data.user);
        closeAuthModal();
        showMobileToast(`✨ Bienvenido, ${data.user.name}`);
        loadDashboardData();
        loadSettings();
      } catch (err) {
        alert(err.message);
      }
    }

    async function handleBarberRegister(e) {
      e.preventDefault();
      const name = document.getElementById('reg-name').value;
      const phone = document.getElementById('reg-phone').value;
      const email = document.getElementById('reg-email').value;
      const password = document.getElementById('reg-password').value;

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, email, password, shopName: 'FAMILIA 1969' })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error en el registro');

        setAuthSession(data.token, data.user);
        closeAuthModal();
        showMobileToast(`🎉 Cuenta de barbero creada con éxito: ${data.user.name}`);
        loadDashboardData();
        loadSettings();
      } catch (err) {
        alert(err.message);
      }
    }

    function setAuthSession(token, user) {
      currentAuthToken = token;
      currentAuthUser = user;
      localStorage.setItem('fam1969_token', token);
      localStorage.setItem('fam1969_user', JSON.stringify(user));
      updateAuthUI();
    }

    function logoutBarber() {
      currentAuthToken = null;
      currentAuthUser = null;
      localStorage.removeItem('fam1969_token');
      localStorage.removeItem('fam1969_user');
      updateAuthUI();
      showMobileToast('Sesión de barbero cerrada.');
      loadDashboardData();
    }

    function updateAuthUI() {
      const loginBtn = document.getElementById('btn-barber-login');
      const loggedBox = document.getElementById('barber-logged-box');
      const phoneDisplay = document.getElementById('topbar-phone-display');

      if (currentAuthToken && currentAuthUser) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (loggedBox) loggedBox.style.display = 'flex';
        if (phoneDisplay) phoneDisplay.textContent = currentAuthUser.phone || '+57 ...';
      } else {
        if (loginBtn) loginBtn.style.display = 'flex';
        if (loggedBox) loggedBox.style.display = 'none';
      }
    }

    function openQuickPhoneModal() {
      const m = document.getElementById('modal-quick-phone');
      const inp = document.getElementById('quick-phone-input');
      const current = (currentAuthUser && currentAuthUser.phone) || (currentSettings && currentSettings.phone) || '';
      if (inp) inp.value = current;
      if (m) m.style.display = 'flex';
    }

    function closeQuickPhoneModal() {
      const m = document.getElementById('modal-quick-phone');
      if (m) m.style.display = 'none';
    }

    async function handleSaveQuickPhone(e) {
      e.preventDefault();
      const newPhone = document.getElementById('quick-phone-input').value.trim();
      if (!newPhone) {
        alert('Por favor ingresa un número válido.');
        return;
      }

      try {
        const headers = { 'Content-Type': 'application/json' };
        if (currentAuthToken) headers['Authorization'] = 'Bearer ' + currentAuthToken;

        const res = await fetch('/api/settings', {
          method: 'PUT',
          headers,
          body: JSON.stringify({ phone: newPhone })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al guardar el teléfono');

        if (currentAuthUser) {
          currentAuthUser.phone = newPhone;
          localStorage.setItem('fam1969_user', JSON.stringify(currentAuthUser));
        }
        if (currentSettings) {
          currentSettings.phone = newPhone;
        }

        updateAuthUI();
        closeQuickPhoneModal();
        showMobileToast(`✅ WhatsApp actualizado con éxito: ${newPhone}`);
        loadDashboardData();
        loadSettings();
      } catch (err) {
        alert('Para cambiar el número oficial del barbero debes iniciar sesión: ' + err.message);
        openAuthModal('login');
      }
    }

    async function checkAuthOnLoad() {
      const savedUser = localStorage.getItem('fam1969_user');
      if (savedUser) {
        try {
          currentAuthUser = JSON.parse(savedUser);
        } catch {}
      }
      if (currentAuthToken) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': 'Bearer ' + currentAuthToken }
          });
          if (res.ok) {
            const data = await res.json();
            currentAuthUser = data.user;
            localStorage.setItem('fam1969_user', JSON.stringify(data.user));
          } else {
            logoutBarber();
          }
        } catch {}
      }
      updateAuthUI();
    }
'''

    if 'checkAuthOnLoad' not in html:
        html = html.replace('window.onload = () => {', js_auth + '\n    window.onload = () => {\n      checkAuthOnLoad();')

    # Update fetch in saveSettings to include Authorization header
    html = html.replace("const res = await fetch('/api/settings', {", "const authHeaders = currentAuthToken ? { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + currentAuthToken } : { 'Content-Type': 'application/json' };\n        const res = await fetch('/api/settings', {\n          headers: authHeaders,")

    # Update fetch in loadDashboardData to include Authorization header
    old_dash = 'const res = await fetch(`/api/dashboard/today?date=${selectedDate}`);'
    new_dash = "const dashHeaders = currentAuthToken ? { 'Authorization': 'Bearer ' + currentAuthToken } : {};\n      const res = await fetch(`/api/dashboard/today?date=${selectedDate}`, { headers: dashHeaders });"
    if old_dash in html:
        html = html.replace(old_dash, new_dash)

    with open(path_public, 'w', encoding='utf-8') as f:
        f.write(html)

    with open(path_root, 'w', encoding='utf-8') as f:
        f.write(html)

    print('Successfully updated public/index.html and index.html!')

if __name__ == '__main__':
    update()
