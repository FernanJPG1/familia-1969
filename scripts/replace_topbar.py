with open('C:/Users/Usuario/Desktop/Barberia/public/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

start_tag = '<div id="topbar-auth-container"'
start_idx = text.find(start_tag)
if start_idx != -1:
    # Find the closing </div> of topbar-auth-container
    # It contains #barber-logged-box inside
    end_box = text.find('</div>', text.find('id="barber-logged-box"', start_idx))
    end_container = text.find('</div>', end_box + 6) + 6
    
    print('Found container range:', start_idx, end_container)
    print(repr(text[start_idx:end_container]))

    new_topbar_auth = '''<div id="topbar-auth-container" style="display: flex; align-items: center; gap: 8px;">
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

          <!-- Controles cuando está logueado como Administrador Master -->
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

    new_html = text[:start_idx] + new_topbar_auth + text[end_container:]
    with open('C:/Users/Usuario/Desktop/Barberia/public/index.html', 'w', encoding='utf-8') as f:
        f.write(new_html)
    with open('C:/Users/Usuario/Desktop/Barberia/index.html', 'w', encoding='utf-8') as f:
        f.write(new_html)
    print('topbar-auth-container successfully replaced!')
