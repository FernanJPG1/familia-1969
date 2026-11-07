import sys, re
sys.stdout.reconfigure(encoding='utf-8')

# Read public/index.html
with open('C:/Users/Usuario/Desktop/Barberia/public/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update Topbar Auth Controls
old_topbar_auth = '''        <!-- Control de Acceso Barbero & WhatsApp Rápido -->
        <div id="topbar-auth-container" style="display: flex; align-items: center; gap: 6px;">
          <button id="btn-barber-login" class="desktop-btn desktop-btn-surface" onclick="openAuthModal('login')" style="border-color: rgba(59, 130, 246, 0.5); background: rgba(14, 23, 44, 0.9);">
            <i class="fa-solid fa-lock" style="color: #38BDF8;"></i>
            <span class="btn-text-full">Acceso Barbero</span><span class="btn-text-short">Login</span>
          </button>
          
          <div id="barber-logged-box" style="display: none; align-items: center; gap: 6px;">
            <button class="desktop-btn desktop-btn-surface" onclick="openQuickPhoneModal()" title="Clic para cambiar mi WhatsApp de atención" style="background: rgba(37, 99, 235, 0.18); border-color: #3B82F6; color: #FFF;">
              <i class="fa-brands fa-whatsapp" style="color: #25D366; font-size: 15px;"></i>
              <span id="topbar-phone-display" style="font-weight: 700; font-family: monospace;">+57 ...</span>
            </button>
            <button class="desktop-btn desktop-btn-surface" onclick="logoutBarber()" title="Cerrar Sesión" style="color: #EF4444; border-color: rgba(239, 68, 68, 0.3);">
              <i class="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
        </div>'''

new_topbar_auth = '''        <!-- Control de Acceso Multi-Barbero & Panel Administrador -->
        <div id="topbar-auth-container" style="display: flex; align-items: center; gap: 8px;">
          <!-- Botón cuando no ha iniciado sesión -->
          <button id="btn-barber-login" class="desktop-btn desktop-btn-surface" onclick="openAuthModal('login')" style="border-color: rgba(59, 130, 246, 0.5); background: rgba(14, 23, 44, 0.9);">
            <i class="fa-solid fa-lock" style="color: #38BDF8;"></i>
            <span class="btn-text-full">Acceso Barbero / Admin</span><span class="btn-text-short">Login</span>
          </button>
          
          <!-- Controles cuando está logueado como Barbero -->
          <div id="barber-logged-box" style="display: none; align-items: center; gap: 6px;">
            <div style="display: flex; align-items: center; gap: 6px; padding: 4px 10px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.4); border-radius: 20px;">
              <span id="topbar-barber-avatar-dot" style="width: 8px; height: 8px; border-radius: 50%; background: #10B981;"></span>
              <span id="topbar-barber-name" style="font-size: 12px; font-weight: 800; color: #F8FAFC;">Barbero</span>
            </div>
            <button class="desktop-btn desktop-btn-surface" onclick="openQuickPhoneModal()" title="Clic para cambiar mi WhatsApp de atención" style="background: rgba(37, 99, 235, 0.18); border-color: #3B82F6; color: #FFF;">
              <i class="fa-brands fa-whatsapp" style="color: #25D366; font-size: 15px;"></i>
              <span id="topbar-phone-display" style="font-weight: 700; font-family: monospace;">+57 ...</span>
            </button>
            <button class="desktop-btn desktop-btn-surface" onclick="logoutBarber()" title="Cerrar Sesión" style="color: #EF4444; border-color: rgba(239, 68, 68, 0.3);">
              <i class="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>

          <!-- Controles cuando está logueado como Administrador -->
          <div id="admin-logged-box" style="display: none; align-items: center; gap: 6px;">
            <button id="btn-admin-panel" class="desktop-btn" onclick="openAdminPanelModal()" style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: #000; font-weight: 800; border: none; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.35); cursor: pointer;">
              <i class="fa-solid fa-crown" style="font-size: 13px;"></i>
              <span>Panel Admin & Barberos</span>
              <span id="admin-pending-badge" style="background: #DC2626; color: #FFF; font-size: 10px; padding: 1px 7px; border-radius: 10px; font-weight: 900; display: none;">0</span>
            </button>
            <button class="desktop-btn desktop-btn-surface" onclick="openQuickPhoneModal()" title="WhatsApp Oficial del Club" style="background: rgba(245, 158, 11, 0.12); border-color: #F59E0B; color: #FFF;">
              <i class="fa-brands fa-whatsapp" style="color: #25D366; font-size: 14px;"></i>
              <span id="admin-phone-display" style="font-weight: 700; font-family: monospace; font-size: 12px;">WhatsApp</span>
            </button>
            <button class="desktop-btn desktop-btn-surface" onclick="logoutBarber()" title="Cerrar Sesión Administrador" style="color: #EF4444; border-color: rgba(239, 68, 68, 0.3);">
              <i class="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
        </div>'''

if old_topbar_auth in html:
    html = html.replace(old_topbar_auth, new_topbar_auth)
    print('Topbar auth updated successfully!')
else:
    print('old_topbar_auth not found!')

# 2. Add Barbero selector in booking modal
old_booking_fields = '''        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="settings-label">Tipo de Corte *</label>
            <select id="m-new-service" class="settings-input" style="margin-top: 4px;"></select>
          </div>

          <div>
            <label class="settings-label">Hora de Inicio *</label>
            <input type="time" id="m-new-time" required value="10:00" class="settings-input" style="margin-top: 4px;">
          </div>
        </div>'''

new_booking_fields = '''        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label class="settings-label">Tipo de Corte *</label>
            <select id="m-new-service" class="settings-input" style="margin-top: 4px;"></select>
          </div>

          <div>
            <label class="settings-label">Hora de Inicio *</label>
            <input type="time" id="m-new-time" required value="10:00" class="settings-input" style="margin-top: 4px;">
          </div>
        </div>

        <div>
          <label class="settings-label">💈 Barbero Preferido *</label>
          <select id="m-new-barber" class="settings-input" style="margin-top: 4px;">
            <option value="">Cualquier Barbero Disponible</option>
          </select>
        </div>'''

if old_booking_fields in html:
    html = html.replace(old_booking_fields, new_booking_fields)
    print('Booking modal barber selector added!')

# 3. Add Admin Panel Modal and Enhanced Auth Modal
admin_panel_modal_html = '''  <!-- ====================================================================== -->
  <!-- MODAL: PANEL DE ADMINISTRACIÓN • GESTIÓN DE BARBEROS & APROBACIONES     -->
  <!-- ====================================================================== -->
  <div id="modal-admin-panel" class="valmont-modal-backdrop" style="display: none; position: fixed; inset: 0; background: rgba(3, 7, 18, 0.88); backdrop-filter: blur(10px); z-index: 9999; justify-content: center; align-items: center; padding: 20px;">
    <div style="background: #090E1D; border: 1.5px solid rgba(245, 158, 11, 0.5); border-radius: 22px; width: 100%; max-width: 900px; max-height: 90vh; box-shadow: 0 30px 80px rgba(0,0,0,0.9); overflow: hidden; display: flex; flex-direction: column;">
      
      <!-- Header -->
      <div style="padding: 22px 28px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; align-items: center; background: radial-gradient(circle at top right, rgba(245,158,11,0.18) 0%, rgba(9,14,29,0.95) 70%, transparent 100%);">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 44px; height: 44px; border-radius: 50%; background: #060912; border: 2px solid #F59E0B; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(245, 158, 11, 0.4);">
            <i class="fa-solid fa-crown" style="color: #F59E0B; font-size: 18px;"></i>
          </div>
          <div>
            <h2 style="font-size: 18px; font-weight: 800; color: #FFF; font-family: 'Outfit', sans-serif;">Panel de Administración • Gestión de Barberos</h2>
            <p style="font-size: 12px; color: #94A3B8;">Autoriza solicitudes, activa cuentas y administra los números de WhatsApp de los barberos</p>
          </div>
        </div>
        <button onclick="closeAdminPanelModal()" style="background: transparent; border: none; color: #94A3B8; font-size: 28px; cursor: pointer;">&times;</button>
      </div>

      <!-- KPIs Bar -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; padding: 18px 28px; background: rgba(6, 9, 18, 0.6); border-bottom: 1px solid rgba(255,255,255,0.06);">
        <div style="background: rgba(14, 23, 44, 0.8); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 12px 16px;">
          <div style="font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase;">Total Barberos</div>
          <div id="admin-kpi-total" style="font-size: 22px; font-weight: 900; color: #FFF; margin-top: 4px;">0</div>
        </div>
        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 12px 16px;">
          <div style="font-size: 11px; font-weight: 700; color: #10B981; text-transform: uppercase;">Activos en Agenda</div>
          <div id="admin-kpi-active" style="font-size: 22px; font-weight: 900; color: #10B981; margin-top: 4px;">0</div>
        </div>
        <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 12px 16px;">
          <div style="font-size: 11px; font-weight: 700; color: #F59E0B; text-transform: uppercase;">Por Aprobar</div>
          <div id="admin-kpi-pending" style="font-size: 22px; font-weight: 900; color: #F59E0B; margin-top: 4px;">0</div>
        </div>
        <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 12px 16px;">
          <div style="font-size: 11px; font-weight: 700; color: #38BDF8; text-transform: uppercase;">Facturación Total</div>
          <div id="admin-kpi-revenue" style="font-size: 22px; font-weight: 900; color: #38BDF8; margin-top: 4px;">$0</div>
        </div>
      </div>

      <!-- Filter Controls & Toolbar -->
      <div style="padding: 14px 28px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.06);">
        <div style="display: flex; gap: 8px;">
          <button id="admin-tab-all" onclick="filterAdminBarbers('all')" class="desktop-btn desktop-btn-surface" style="font-size: 12px; padding: 6px 14px; border-color: #3B82F6; color: #FFF;">Todos</button>
          <button id="admin-tab-pending" onclick="filterAdminBarbers('pending')" class="desktop-btn desktop-btn-surface" style="font-size: 12px; padding: 6px 14px; border-color: rgba(255,255,255,0.1); color: #94A3B8;">🟡 Pendientes</button>
          <button id="admin-tab-active" onclick="filterAdminBarbers('active')" class="desktop-btn desktop-btn-surface" style="font-size: 12px; padding: 6px 14px; border-color: rgba(255,255,255,0.1); color: #94A3B8;">🟢 Activos</button>
        </div>
        <button onclick="loadAdminBarbersList()" class="desktop-btn desktop-btn-surface" style="font-size: 12px; padding: 6px 14px;">
          <i class="fa-solid fa-arrows-rotate"></i> Actualizar
        </button>
      </div>

      <!-- Barber List Container (Scrollable) -->
      <div id="admin-barbers-container" style="padding: 20px 28px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 12px;">
        <div style="text-align: center; color: #94A3B8; padding: 30px;">Cargando lista de barberos...</div>
      </div>

    </div>
  </div>
'''

# Check if modal-admin-panel already exists
if 'id="modal-admin-panel"' not in html:
    # Insert right before </body>
    html = html.replace('</body>', admin_panel_modal_html + '\n</body>')
    print('modal-admin-panel added before </body>!')

# 4. Update modal-auth to show pending message alert
auth_alert_placeholder = '''      <div style="padding: 24px; display: flex; flex-direction: column; gap: 16px;">
        <!-- Selector de Tabs -->'''

new_auth_alert_box = '''      <div style="padding: 24px; display: flex; flex-direction: column; gap: 16px;">
        <!-- Banner de Alerta para Cuenta Pendiente de Aprobación -->
        <div id="auth-pending-alert" style="display: none; background: rgba(245, 158, 11, 0.15); border: 1.5px solid #F59E0B; border-radius: 12px; padding: 14px; margin-bottom: 4px;">
          <div style="display: flex; gap: 12px; align-items: flex-start;">
            <i class="fa-solid fa-clock-rotate-left" style="color: #F59E0B; font-size: 20px; margin-top: 2px;"></i>
            <div>
              <div style="font-weight: 800; color: #F59E0B; font-size: 13px;">Cuenta en Revisión</div>
              <div id="auth-pending-text" style="font-size: 12px; color: #F8FAFC; margin-top: 4px; line-height: 1.4;">Tu cuenta de barbero fue registrada pero se encuentra pendiente de activación por el Administrador de FAMILIA 1969. Una vez aprobada podrás ingresar.</div>
            </div>
          </div>
        </div>

        <!-- Selector de Tabs -->'''

if auth_alert_placeholder in html:
    html = html.replace(auth_alert_placeholder, new_auth_alert_box)
    print('auth-pending-alert added to modal-auth!')

# 5. Replace JavaScript Auth Functions with Multi-Barber + Admin Logic
old_js_start = html.find('let currentAuthToken = localStorage.getItem')
old_js_end = html.find('async function handleSaveQuickPhone(e)')
if old_js_start != -1 and old_js_end != -1:
    end_of_func = html.find('}', old_js_end) + 1
    
    new_js_code = '''let currentAuthToken = localStorage.getItem('fam1969_token') || null;
    let currentAuthUser = null;
    try {
      currentAuthUser = JSON.parse(localStorage.getItem('fam1969_user') || 'null');
    } catch (e) {
      currentAuthUser = null;
    }

    let allAdminBarbers = [];
    let currentAdminFilter = 'all';

    function openAuthModal(tab = 'login') {
      const m = document.getElementById('modal-auth');
      if (m) m.style.display = 'flex';
      hideAuthPendingAlert();
      switchAuthTab(tab);
    }

    function closeAuthModal() {
      const m = document.getElementById('modal-auth');
      if (m) m.style.display = 'none';
      hideAuthPendingAlert();
    }

    function showAuthPendingAlert(msg) {
      const alertBox = document.getElementById('auth-pending-alert');
      const alertText = document.getElementById('auth-pending-text');
      if (alertBox) alertBox.style.display = 'block';
      if (alertText && msg) alertText.textContent = msg;
    }

    function hideAuthPendingAlert() {
      const alertBox = document.getElementById('auth-pending-alert');
      if (alertBox) alertBox.style.display = 'none';
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
      hideAuthPendingAlert();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

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

        setAuthSession(data.token, data.user);
        closeAuthModal();
        showMobileToast(`✨ Bienvenido, ${data.user.name} (${data.user.role === 'admin' ? 'Administrador' : 'Barbero'})`);
        loadDashboardData();
        loadSettings();

        if (data.user.role === 'admin') {
          checkPendingBarbersCount();
        }
      } catch (err) {
        alert(err.message);
      }
    }

    async function handleBarberRegister(e) {
      e.preventDefault();
      hideAuthPendingAlert();
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

        switchAuthTab('login');
        showAuthPendingAlert(data.message || 'Tu cuenta ha sido creada y está pendiente de activación por el Administrador.');
        showMobileToast('✓ Solicitud de registro enviada con éxito');
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
      showMobileToast('Sesión cerrada correctamente.');
      loadDashboardData();
    }

    function updateAuthUI() {
      const loginBtn = document.getElementById('btn-barber-login');
      const barberBox = document.getElementById('barber-logged-box');
      const adminBox = document.getElementById('admin-logged-box');
      const barberName = document.getElementById('topbar-barber-name');
      const phoneDisplay = document.getElementById('topbar-phone-display');
      const adminPhoneDisplay = document.getElementById('admin-phone-display');
      const dot = document.getElementById('topbar-barber-avatar-dot');

      if (currentAuthToken && currentAuthUser) {
        if (loginBtn) loginBtn.style.display = 'none';

        if (currentAuthUser.role === 'admin') {
          if (barberBox) barberBox.style.display = 'none';
          if (adminBox) adminBox.style.display = 'flex';
          if (adminPhoneDisplay) adminPhoneDisplay.textContent = currentAuthUser.phone || 'WhatsApp';
          checkPendingBarbersCount();
        } else {
          if (adminBox) adminBox.style.display = 'none';
          if (barberBox) barberBox.style.display = 'flex';
          if (barberName) barberName.textContent = currentAuthUser.name || 'Barbero';
          if (phoneDisplay) phoneDisplay.textContent = currentAuthUser.phone || '+57 ...';
          if (dot && currentAuthUser.colorTag) dot.style.background = currentAuthUser.colorTag;
        }
      } else {
        if (loginBtn) loginBtn.style.display = 'flex';
        if (barberBox) barberBox.style.display = 'none';
        if (adminBox) adminBox.style.display = 'none';
      }
    }

    // ======================================================================
    // FUNCIONES DEL PANEL DE ADMINISTRACIÓN MASTER
    // ======================================================================
    function openAdminPanelModal() {
      const m = document.getElementById('modal-admin-panel');
      if (m) m.style.display = 'flex';
      loadAdminBarbersList();
    }

    function closeAdminPanelModal() {
      const m = document.getElementById('modal-admin-panel');
      if (m) m.style.display = 'none';
    }

    async function checkPendingBarbersCount() {
      if (!currentAuthToken || !currentAuthUser || currentAuthUser.role !== 'admin') return;
      try {
        const res = await fetch('/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${currentAuthToken}` }
        });
        if (res.ok) {
          const stats = await res.json();
          const badge = document.getElementById('admin-pending-badge');
          if (badge) {
            if (stats.pendingBarbers > 0) {
              badge.textContent = `${stats.pendingBarbers} Pendiente${stats.pendingBarbers > 1 ? 's' : ''}`;
              badge.style.display = 'inline-block';
            } else {
              badge.style.display = 'none';
            }
          }
        }
      } catch (e) {}
    }

    async function loadAdminBarbersList() {
      if (!currentAuthToken) return;
      try {
        const [barbersRes, statsRes] = await Promise.all([
          fetch('/api/admin/barbers', { headers: { 'Authorization': `Bearer ${currentAuthToken}` } }),
          fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${currentAuthToken}` } })
        ]);

        if (barbersRes.ok) {
          const bData = await barbersRes.json();
          allAdminBarbers = bData.barbers || [];
          renderAdminBarbers();
        }

        if (statsRes.ok) {
          const sData = await statsRes.json();
          const kpiTotal = document.getElementById('admin-kpi-total');
          const kpiActive = document.getElementById('admin-kpi-active');
          const kpiPending = document.getElementById('admin-kpi-pending');
          const kpiRevenue = document.getElementById('admin-kpi-revenue');

          if (kpiTotal) kpiTotal.textContent = sData.totalBarbers || 0;
          if (kpiActive) kpiActive.textContent = sData.activeBarbers || 0;
          if (kpiPending) kpiPending.textContent = sData.pendingBarbers || 0;
          if (kpiRevenue) kpiRevenue.textContent = `$${(sData.totalRevenue || 0).toLocaleString('es-CO')}`;

          const badge = document.getElementById('admin-pending-badge');
          if (badge) {
            if (sData.pendingBarbers > 0) {
              badge.textContent = `${sData.pendingBarbers}`;
              badge.style.display = 'inline-block';
            } else {
              badge.style.display = 'none';
            }
          }
        }
      } catch (err) {
        console.error('Error cargando lista admin:', err);
      }
    }

    function filterAdminBarbers(filter) {
      currentAdminFilter = filter;
      const tabAll = document.getElementById('admin-tab-all');
      const tabPending = document.getElementById('admin-tab-pending');
      const tabActive = document.getElementById('admin-tab-active');

      [tabAll, tabPending, tabActive].forEach(tab => {
        if (tab) {
          tab.style.borderColor = 'rgba(255,255,255,0.1)';
          tab.style.color = '#94A3B8';
        }
      });

      if (filter === 'all' && tabAll) { tabAll.style.borderColor = '#3B82F6'; tabAll.style.color = '#FFF'; }
      if (filter === 'pending' && tabPending) { tabPending.style.borderColor = '#F59E0B'; tabPending.style.color = '#FFF'; }
      if (filter === 'active' && tabActive) { tabActive.style.borderColor = '#10B981'; tabActive.style.color = '#FFF'; }

      renderAdminBarbers();
    }

    function renderAdminBarbers() {
      const container = document.getElementById('admin-barbers-container');
      if (!container) return;

      let list = allAdminBarbers;
      if (currentAdminFilter === 'pending') {
        list = allAdminBarbers.filter(b => b.status === 'pending' || !b.isActive);
      } else if (currentAdminFilter === 'active') {
        list = allAdminBarbers.filter(b => b.isActive && b.status === 'active');
      }

      if (list.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 40px; color: #94A3B8;">
            <i class="fa-solid fa-users" style="font-size: 32px; color: rgba(255,255,255,0.15); margin-bottom: 12px; display: block;"></i>
            <div style="font-size: 14px; font-weight: 700;">No hay barberos en esta sección</div>
          </div>
        `;
        return;
      }

      container.innerHTML = list.map(b => {
        const isPending = b.status === 'pending' || !b.isActive;
        const color = b.colorTag || '#3B82F6';
        const phoneClean = (b.phone || '').replace(/[^0-9]/g, '');
        const waLink = `https://wa.me/${phoneClean}?text=${encodeURIComponent(`Hola ${b.name}, te saludo desde la administración de FAMILIA 1969 respecto a tu cuenta de barbero.`)}`;

        return `
          <div style="background: rgba(14, 23, 44, 0.7); border: 1.5px solid ${isPending ? 'rgba(245, 158, 11, 0.5)' : 'rgba(255, 255, 255, 0.08)'}; border-radius: 16px; padding: 18px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;">
            
            <!-- Datos del Barbero -->
            <div style="display: flex; align-items: center; gap: 14px;">
              <div style="width: 48px; height: 48px; border-radius: 50%; background: #060912; border: 2.5px solid ${color}; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; color: #FFF; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
                ${b.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="font-size: 15px; font-weight: 800; color: #FFF;">${b.name}</span>
                  ${isPending 
                    ? '<span style="background: rgba(245, 158, 11, 0.18); color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.4); font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 10px;">🟡 PENDIENTE DE ACTIVACIÓN</span>' 
                    : '<span style="background: rgba(16, 185, 129, 0.18); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.4); font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 10px;">🟢 ACTIVO EN AGENDA</span>'
                  }
                </div>
                <div style="font-size: 12px; color: #94A3B8; margin-top: 3px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                  <span><i class="fa-regular fa-envelope"></i> ${b.email}</span>
                  <span><i class="fa-solid fa-calendar-check"></i> ${b.appointmentsCount || 0} citas</span>
                  <span><i class="fa-solid fa-coins" style="color: #38BDF8;"></i> $${(b.totalEarnings || 0).toLocaleString('es-CO')}</span>
                </div>
              </div>
            </div>

            <!-- WhatsApp Oficial & Acciones -->
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <!-- Botón Contactar WhatsApp Oficial -->
              <a href="${waLink}" target="_blank" style="text-decoration: none; display: flex; align-items: center; gap: 6px; padding: 7px 12px; background: rgba(37, 211, 102, 0.12); border: 1px solid rgba(37, 211, 102, 0.4); border-radius: 10px; color: #25D366; font-size: 12px; font-weight: 700; transition: all 0.2s;">
                <i class="fa-brands fa-whatsapp" style="font-size: 15px;"></i>
                <span>${b.phone || 'Sin WhatsApp'}</span>
              </a>

              ${isPending 
                ? `<button onclick="adminSetBarberStatus('${b.id}', 'active', true)" class="desktop-btn" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #FFF; font-weight: 800; font-size: 12px; padding: 8px 16px; border: none; border-radius: 10px; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 14px rgba(16,185,129,0.3);">
                     <i class="fa-solid fa-check"></i> Aprobar & Activar
                   </button>` 
                : `<button onclick="adminSetBarberStatus('${b.id}', 'suspended', false)" class="desktop-btn" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #EF4444; font-weight: 700; font-size: 12px; padding: 8px 14px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                     <i class="fa-solid fa-pause"></i> Desactivar
                   </button>`
              }

              <!-- Botón Eliminar Barbero -->
              <button onclick="adminDeleteBarber('${b.id}', '${b.name}')" title="Eliminar cuenta de barbero" style="background: transparent; border: 1px solid rgba(255,255,255,0.1); color: #64748B; width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>

          </div>
        `;
      }).join('');
    }

    async function adminSetBarberStatus(barberId, status, isActive) {
      if (!currentAuthToken) return;
      try {
        const res = await fetch(`/api/admin/barbers/${barberId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentAuthToken}`
          },
          body: JSON.stringify({ status, isActive })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al actualizar barbero');

        showMobileToast(`✓ ${data.message || 'Estado actualizado'}`);
        loadAdminBarbersList();
        loadDashboardData();
      } catch (err) {
        alert(err.message);
      }
    }

    async function adminDeleteBarber(barberId, name) {
      if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente la cuenta del barbero "${name}"?`)) return;
      if (!currentAuthToken) return;

      try {
        const res = await fetch(`/api/admin/barbers/${barberId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${currentAuthToken}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error al eliminar');

        showMobileToast(`✓ ${data.message || 'Barbero eliminado'}`);
        loadAdminBarbersList();
        loadDashboardData();
      } catch (err) {
        alert(err.message);
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
      if (!newPhone) return;

      if (!currentAuthToken) {
        alert('Debes iniciar sesión para actualizar tu número oficial.');
        openAuthModal('login');
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentAuthToken}`
          },
          body: JSON.stringify({ phone: newPhone })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Error actualizando teléfono');

        if (currentAuthUser) {
          currentAuthUser.phone = newPhone;
          localStorage.setItem('fam1969_user', JSON.stringify(currentAuthUser));
        }

        closeQuickPhoneModal();
        updateAuthUI();
        showMobileToast(`📱 WhatsApp oficial actualizado a ${newPhone}`);
        loadDashboardData();
        loadSettings();
      } catch (err) {
        alert(err.message);
      }
    }'''

    html = html[:old_js_start] + new_js_code + html[end_of_func:]
    print('JavaScript auth & admin functions replaced successfully!')
else:
    print('JavaScript markers not found!')

# Write back to public/index.html and root index.html
with open('C:/Users/Usuario/Desktop/Barberia/public/index.html', 'w', encoding='utf-8') as f:
    f.write(html)
with open('C:/Users/Usuario/Desktop/Barberia/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('public/index.html and root index.html updated successfully!')
