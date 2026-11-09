import os
import re

INDEX_PATH = r'C:\Users\Usuario\Desktop\Barberia\index.html'
PUBLIC_INDEX_PATH = r'C:\Users\Usuario\Desktop\Barberia\public\index.html'

with open(INDEX_PATH, 'r', encoding='utf-8') as f:
    html = f.read()

# ==============================================================================
# 1. LANDING PAGE CSS (Injected before </head>)
# ==============================================================================
landing_css = """
  <!-- ESTILOS EXCLUSIVOS LANDING PAGE SCROLLYTELLING FAMILIA 1969 -->
  <style id="familia1969-landing-styles">
    /* Reset & Comportamiento General Landing */
    body.is-landing-view {
      overflow-y: auto !important;
      overflow-x: hidden !important;
      height: auto !important;
      min-height: 100vh !important;
      display: block !important;
      background-color: #060912 !important;
      color: #F8FAFC !important;
    }

    #landing-view {
      width: 100%;
      min-height: 100vh;
      background: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(56, 189, 248, 0.12), transparent 70%),
                  radial-gradient(circle 800px at 85% 25%, rgba(37, 99, 235, 0.08), transparent 60%),
                  radial-gradient(circle 600px at 15% 65%, rgba(245, 158, 11, 0.05), transparent 50%),
                  #060912;
      color: #F8FAFC;
      font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif;
      position: relative;
      overflow-x: hidden;
      line-height: 1.6;
    }

    /* Navbar Glass Sticky */
    .landing-nav {
      position: sticky;
      top: 0;
      z-index: 1000;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      background: rgba(6, 9, 18, 0.82);
      border-bottom: 1px solid rgba(56, 189, 248, 0.15);
      padding: 14px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.3s ease;
    }
    .landing-nav-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      cursor: pointer;
    }
    .landing-nav-logo {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      object-fit: contain;
      filter: drop-shadow(0 2px 10px rgba(56, 189, 248, 0.4));
      transition: transform 0.3s ease;
    }
    .landing-nav-brand:hover .landing-nav-logo {
      transform: scale(1.08) rotate(3deg);
    }
    .landing-brand-text {
      display: flex;
      flex-direction: column;
    }
    .landing-brand-title {
      font-size: 17px;
      font-weight: 900;
      letter-spacing: 1.5px;
      color: #FFFFFF;
      font-family: 'Outfit', sans-serif;
      line-height: 1.1;
    }
    .landing-brand-sub {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 2.2px;
      color: #38BDF8;
      text-transform: uppercase;
    }
    .landing-nav-links {
      display: flex;
      align-items: center;
      gap: 28px;
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .landing-nav-link {
      color: #94A3B8;
      font-size: 13.5px;
      font-weight: 600;
      text-decoration: none;
      transition: color 0.2s ease;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .landing-nav-link:hover {
      color: #38BDF8;
    }
    .landing-nav-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* Botones de Acción Landing */
    .landing-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 9px 18px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      border: 1px solid transparent;
      text-decoration: none;
      white-space: nowrap;
    }
    .landing-btn-outline {
      background: rgba(15, 23, 42, 0.7);
      border-color: rgba(56, 189, 248, 0.35);
      color: #E2E8F0;
      backdrop-filter: blur(10px);
    }
    .landing-btn-outline:hover {
      background: rgba(56, 189, 248, 0.15);
      border-color: #38BDF8;
      color: #FFFFFF;
      transform: translateY(-1px);
      box-shadow: 0 4px 14px rgba(56, 189, 248, 0.2);
    }
    .landing-btn-sapphire {
      background: linear-gradient(135deg, #1E40AF 0%, #2563EB 50%, #38BDF8 100%);
      color: #FFFFFF;
      border: 1px solid rgba(56, 189, 248, 0.5);
      box-shadow: 0 4px 18px rgba(37, 99, 235, 0.35);
    }
    .landing-btn-sapphire:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(56, 189, 248, 0.5);
      filter: brightness(1.1);
    }
    .landing-btn-gold {
      background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
      color: #060912;
      font-weight: 800;
      border: 1px solid rgba(245, 158, 11, 0.6);
      box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
    }
    .landing-btn-gold:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 22px rgba(245, 158, 11, 0.45);
      filter: brightness(1.08);
    }

    /* Hero Section */
    .landing-hero {
      max-width: 1240px;
      margin: 0 auto;
      padding: 64px 24px 50px;
      text-align: center;
      position: relative;
    }
    .landing-emblem-wrap {
      display: inline-flex;
      position: relative;
      margin-bottom: 24px;
    }
    .landing-emblem-img {
      width: 104px;
      height: 104px;
      object-fit: contain;
      filter: drop-shadow(0 0 35px rgba(56, 189, 248, 0.5));
      animation: floatEmblem 6s ease-in-out infinite;
    }
    @keyframes floatEmblem {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-8px) rotate(2deg); }
    }
    .landing-badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      background: rgba(14, 23, 44, 0.85);
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: 30px;
      font-size: 11.5px;
      font-weight: 800;
      letter-spacing: 1.5px;
      color: #38BDF8;
      text-transform: uppercase;
      margin-bottom: 22px;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
    }
    .landing-hero-title {
      font-size: clamp(34px, 5.5vw, 68px);
      font-weight: 900;
      letter-spacing: -1px;
      line-height: 1.08;
      color: #FFFFFF;
      margin-bottom: 20px;
      max-width: 980px;
      margin-left: auto;
      margin-right: auto;
    }
    .text-gradient-sapphire {
      background: linear-gradient(135deg, #FFFFFF 0%, #BAE6FD 30%, #38BDF8 70%, #3B82F6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .landing-hero-subtitle {
      font-size: clamp(15px, 1.8vw, 19px);
      color: #94A3B8;
      max-width: 760px;
      margin: 0 auto 36px;
      line-height: 1.65;
    }
    .landing-hero-actions {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 14px;
      flex-wrap: wrap;
      margin-bottom: 48px;
    }
    .landing-btn-hero-main {
      padding: 14px 30px;
      font-size: 15.5px;
      border-radius: 14px;
      font-weight: 800;
    }

    /* Live Trust Metrics Bar */
    .landing-metrics-bar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
      gap: 16px;
      max-width: 1040px;
      margin: 0 auto;
      background: rgba(11, 19, 38, 0.65);
      border: 1px solid rgba(56, 189, 248, 0.18);
      border-radius: 20px;
      padding: 18px 24px;
      backdrop-filter: blur(14px);
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.45);
    }
    .landing-metric-item {
      display: flex;
      align-items: center;
      gap: 14px;
      text-align: left;
    }
    .landing-metric-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(56, 189, 248, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      color: #38BDF8;
      flex-shrink: 0;
    }
    .landing-metric-val {
      font-size: 16px;
      font-weight: 800;
      color: #F8FAFC;
      line-height: 1.2;
    }
    .landing-metric-lbl {
      font-size: 11.5px;
      color: #94A3B8;
      margin-top: 2px;
    }

    /* ======================================================================== */
    /* SECCIÓN SCROLLYTELLING INTERACTIVA                                       */
    /* ======================================================================== */
    .scrolly-section {
      max-width: 1240px;
      margin: 60px auto 0;
      padding: 40px 24px 80px;
      position: relative;
    }
    .scrolly-header {
      text-align: center;
      margin-bottom: 50px;
    }
    .scrolly-eyebrow {
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 2px;
      color: #38BDF8;
      text-transform: uppercase;
      margin-bottom: 10px;
      display: inline-block;
    }
    .scrolly-title {
      font-size: clamp(28px, 4vw, 44px);
      font-weight: 900;
      color: #FFFFFF;
      letter-spacing: -0.5px;
      line-height: 1.15;
    }

    .scrolly-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 48px;
      align-items: start;
      position: relative;
    }

    /* Columna Izquierda: Escenario Visual Sticky */
    .scrolly-sticky-stage {
      position: sticky;
      top: 100px;
      background: rgba(11, 19, 38, 0.85);
      border: 1.5px solid rgba(56, 189, 248, 0.25);
      border-radius: 24px;
      padding: 26px;
      backdrop-filter: blur(20px);
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08);
      overflow: hidden;
    }
    .scrolly-stage-topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      margin-bottom: 20px;
    }
    .scrolly-stage-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 20px;
      background: rgba(56, 189, 248, 0.15);
      border: 1px solid rgba(56, 189, 248, 0.3);
      font-size: 11px;
      font-weight: 800;
      color: #38BDF8;
    }
    .scrolly-step-indicators {
      display: flex;
      gap: 6px;
    }
    .scrolly-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.15);
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .scrolly-dot.active {
      background: #38BDF8;
      box-shadow: 0 0 10px #38BDF8;
      width: 24px;
      border-radius: 10px;
    }

    /* Escenas Visuales en el Stage */
    .scrolly-scene {
      display: none;
      animation: fadeInScene 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .scrolly-scene.active {
      display: block;
    }
    @keyframes fadeInScene {
      from { opacity: 0; transform: translateY(12px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* Escena 1: WhatsApp Card */
    .mock-chat-card {
      background: #0B1326;
      border: 1px solid rgba(37, 211, 102, 0.3);
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
    }
    .mock-chat-header {
      background: #128C7E;
      color: #FFF;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .mock-chat-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: #075E54;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      color: #FFF;
      border: 2px solid #FFF;
    }
    .mock-chat-body {
      padding: 20px 16px;
      background: #080D1A;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .mock-chat-bubble {
      background: #054740;
      color: #E2E8F0;
      padding: 12px 14px;
      border-radius: 14px;
      border-top-left-radius: 2px;
      font-size: 13px;
      line-height: 1.45;
      max-width: 90%;
      border-left: 3px solid #25D366;
    }
    .mock-chat-time {
      font-size: 10px;
      color: #94A3B8;
      text-align: right;
      margin-top: 4px;
    }

    /* Escena 2: NIST Shield Card */
    .mock-vault-card {
      background: #080E1C;
      border: 1.5px solid rgba(56, 189, 248, 0.3);
      border-radius: 18px;
      padding: 24px;
      text-align: center;
    }
    .mock-shield-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(56, 189, 248, 0.12);
      border: 2px solid #38BDF8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      color: #38BDF8;
      margin: 0 auto 16px;
      box-shadow: 0 0 25px rgba(56, 189, 248, 0.35);
    }
    .mock-cipher-box {
      background: #050811;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 12px;
      text-align: left;
      font-family: monospace;
      font-size: 11px;
      color: #38BDF8;
      margin: 14px 0;
    }

    /* Escena 3: Admin Approval Cockpit */
    .mock-admin-card {
      background: #0B1326;
      border: 1.5px solid rgba(245, 158, 11, 0.3);
      border-radius: 18px;
      padding: 20px;
    }
    .mock-barber-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      margin-bottom: 10px;
    }

    /* Escena 4: Smart Schedule Matrix */
    .mock-schedule-card {
      background: #080D1A;
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 18px;
      padding: 18px;
    }
    .mock-slot-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-top: 14px;
    }
    .mock-slot {
      padding: 10px 12px;
      border-radius: 10px;
      font-size: 12px;
      font-weight: 700;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .mock-slot.occupied {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #F87171;
    }
    .mock-slot.available {
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.35);
      color: #34D399;
    }

    /* Columna Derecha: Tarjetas de Historia Scrollytelling */
    .scrolly-narrative {
      display: flex;
      flex-direction: column;
      gap: 40px;
    }
    .scrolly-step {
      background: rgba(11, 19, 38, 0.6);
      border: 1.5px solid rgba(255, 255, 255, 0.08);
      border-radius: 22px;
      padding: 34px;
      transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
      cursor: pointer;
    }
    .scrolly-step:hover,
    .scrolly-step.active {
      background: rgba(14, 23, 44, 0.9);
      border-color: rgba(56, 189, 248, 0.45);
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.45), 0 0 25px rgba(56, 189, 248, 0.15);
      transform: translateY(-2px);
    }
    .scrolly-step-num {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 2px;
      color: #38BDF8;
      margin-bottom: 14px;
      text-transform: uppercase;
    }
    .scrolly-step-title {
      font-size: 24px;
      font-weight: 800;
      color: #FFFFFF;
      margin-bottom: 12px;
      line-height: 1.25;
    }
    .scrolly-step-desc {
      font-size: 14.5px;
      color: #94A3B8;
      line-height: 1.65;
      margin-bottom: 20px;
    }
    .scrolly-feature-list {
      list-style: none;
      padding: 0;
      margin: 0 0 24px 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .scrolly-feature-item {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13.5px;
      color: #CBD5E1;
    }
    .scrolly-feature-item i {
      color: #38BDF8;
      font-size: 13px;
    }

    /* ======================================================================== */
    /* VITRINA DE SERVICIOS VIP                                                 */
    /* ======================================================================== */
    .services-showcase-section {
      max-width: 1240px;
      margin: 80px auto 0;
      padding: 40px 24px 60px;
    }
    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 22px;
      margin-top: 36px;
    }
    .vip-service-card {
      background: rgba(11, 19, 38, 0.7);
      border: 1px solid rgba(56, 189, 248, 0.16);
      border-radius: 20px;
      padding: 28px 24px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      backdrop-filter: blur(14px);
      transition: all 0.3s ease;
      position: relative;
    }
    .vip-service-card:hover {
      border-color: rgba(56, 189, 248, 0.45);
      transform: translateY(-4px);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(56, 189, 248, 0.12);
    }
    .vip-service-card.featured {
      border-color: rgba(245, 158, 11, 0.4);
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(11, 19, 38, 0.85) 100%);
    }
    .vip-badge {
      position: absolute;
      top: -12px;
      right: 20px;
      background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
      color: #060912;
      font-size: 10.5px;
      font-weight: 900;
      letter-spacing: 1px;
      padding: 3px 12px;
      border-radius: 12px;
      text-transform: uppercase;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.35);
    }
    .vip-service-price {
      font-size: 28px;
      font-weight: 900;
      color: #38BDF8;
      font-family: 'Outfit', sans-serif;
      margin: 14px 0 6px;
    }
    .vip-service-card.featured .vip-service-price {
      color: #F59E0B;
    }

    /* ======================================================================== */
    /* GRAN BANNER DE CIERRE / CONVERSIÓN                                       */
    /* ======================================================================== */
    .landing-cta-banner {
      max-width: 1140px;
      margin: 70px auto 40px;
      padding: 56px 36px;
      background: radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.18), transparent 70%),
                  linear-gradient(135deg, rgba(14, 23, 44, 0.95) 0%, rgba(6, 9, 18, 0.98) 100%);
      border: 1.5px solid rgba(56, 189, 248, 0.28);
      border-radius: 28px;
      text-align: center;
      box-shadow: 0 30px 70px rgba(0, 0, 0, 0.65);
    }
    .landing-cta-title {
      font-size: clamp(28px, 4vw, 44px);
      font-weight: 900;
      color: #FFFFFF;
      margin-bottom: 16px;
      line-height: 1.15;
    }
    .landing-cta-desc {
      font-size: 16px;
      color: #94A3B8;
      max-width: 680px;
      margin: 0 auto 36px;
    }

    /* Footer Landing */
    .landing-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding: 40px 24px;
      text-align: center;
      color: #64748B;
      font-size: 12.5px;
    }

    /* Responsive Queries */
    @media (max-width: 900px) {
      .landing-nav-links { display: none; }
      .scrolly-grid { grid-template-columns: 1fr; }
      .scrolly-sticky-stage { position: relative; top: 0; margin-bottom: 30px; }
      .landing-hero { padding: 40px 16px 30px; }
      .landing-metrics-bar { grid-template-columns: 1fr; }
    }
  </style>
"""

# ==============================================================================
# 2. LANDING PAGE HTML (Inserted at the start of <body>)
# ==============================================================================
landing_html = """
  <!-- ====================================================================== -->
  <!-- VISTA 1: LANDING PAGE SCROLLYTELLING FAMILIA 1969                      -->
  <!-- ====================================================================== -->
  <div id="landing-view">

    <!-- BARRA DE NAVEGACIÓN STICKY CON ACCIONES DIRECTAS -->
    <header class="landing-nav" id="landing-navbar">
      <div class="landing-nav-brand" onclick="showLandingView()">
        <img src="/assets/brand/familia1969-badge-blue.png" alt="FAMILIA 1969 Emblem" class="landing-nav-logo">
        <div class="landing-brand-text">
          <span class="landing-brand-title">FAMILIA 1969</span>
          <span class="landing-brand-sub">BARBER CLUB &bull; EST. 1969</span>
        </div>
      </div>

      <nav class="landing-nav-links">
        <a class="landing-nav-link" href="#hero-chapter"><i class="fa-solid fa-gem" style="color: #38BDF8;"></i> Manifiesto</a>
        <a class="landing-nav-link" href="#scrolly-chapter"><i class="fa-solid fa-layer-group" style="color: #38BDF8;"></i> El Sistema</a>
        <a class="landing-nav-link" href="#security-chapter"><i class="fa-solid fa-shield-halved" style="color: #38BDF8;"></i> Privacidad NIST</a>
        <a class="landing-nav-link" href="#services-chapter"><i class="fa-solid fa-scissors" style="color: #F59E0B;"></i> Servicios VIP</a>
      </nav>

      <div class="landing-nav-actions">
        <button onclick="openAuthModal('login')" class="landing-btn landing-btn-outline" title="Iniciar sesión con tu cuenta de Barbero o Administrador">
          <i class="fa-solid fa-lock" style="color: #38BDF8;"></i>
          <span>Iniciar Sesión</span>
        </button>
        <button onclick="openAuthModal('register')" class="landing-btn landing-btn-sapphire" title="Registrarte como barbero con tu propio WhatsApp">
          <i class="fa-solid fa-user-plus"></i>
          <span>Registrarse como Barbero</span>
        </button>
        <button onclick="showAppView()" class="landing-btn landing-btn-gold" title="Entrar directo a la agenda de reservas del sistema">
          <i class="fa-solid fa-calendar-check"></i>
          <span>Entrar al Sistema</span>
        </button>
      </div>
    </header>

    <!-- HERO PRINCIPAL (CAPÍTULO 0) -->
    <section class="landing-hero" id="hero-chapter">
      <div class="landing-emblem-wrap">
        <img src="/assets/brand/familia1969-badge-blue.png" alt="FAMILIA 1969 Imperial Badge" class="landing-emblem-img">
      </div>
      
      <div class="landing-badge-pill">
        <i class="fa-solid fa-crown" style="color: #F59E0B;"></i>
        <span>EL ESTÁNDAR SUPREMO DE LA BARBERÍA DIGITAL</span>
      </div>

      <h1 class="landing-hero-title">
        Tradición Centenaria.<br>
        <span class="text-gradient-sapphire">Precisión Digital Implacable.</span>
      </h1>

      <p class="landing-hero-subtitle">
        El primer ecosistema de Barber Club donde cada barbero gestiona su propio WhatsApp oficial, control independiente y blindaje criptográfico de grado militar para la máxima privacidad.
      </p>

      <div class="landing-hero-actions">
        <button onclick="showAppView()" class="landing-btn landing-btn-gold landing-btn-hero-main">
          <i class="fa-solid fa-calendar-day"></i>
          <span>Agendar Cita en Línea</span>
          <i class="fa-solid fa-arrow-right" style="margin-left: 4px;"></i>
        </button>

        <button onclick="openAuthModal('register')" class="landing-btn landing-btn-sapphire landing-btn-hero-main">
          <i class="fa-brands fa-whatsapp" style="color: #25D366; font-size: 18px;"></i>
          <span>Unirme como Barbero</span>
        </button>

        <button onclick="openAuthModal('login')" class="landing-btn landing-btn-outline landing-btn-hero-main">
          <i class="fa-solid fa-arrow-right-to-bracket"></i>
          <span>Acceso Miembros</span>
        </button>
      </div>

      <!-- MÉTRICAS CLAVE EN VIVO -->
      <div class="landing-metrics-bar">
        <div class="landing-metric-item">
          <div class="landing-metric-icon"><i class="fa-brands fa-whatsapp" style="color: #25D366;"></i></div>
          <div>
            <div class="landing-metric-val">WhatsApp Directo</div>
            <div class="landing-metric-lbl">Sin intermediarios ni desvío</div>
          </div>
        </div>

        <div class="landing-metric-item">
          <div class="landing-metric-icon"><i class="fa-solid fa-shield-halved"></i></div>
          <div>
            <div class="landing-metric-val">Criptografía NIST</div>
            <div class="landing-metric-lbl">scrypt v2 y teléfonos ocultos</div>
          </div>
        </div>

        <div class="landing-metric-item">
          <div class="landing-metric-icon"><i class="fa-solid fa-bolt" style="color: #F59E0B;"></i></div>
          <div>
            <div class="landing-metric-val">&lt; 30 ms Latencia</div>
            <div class="landing-metric-lbl">Arquitectura Serverless Edge</div>
          </div>
        </div>

        <div class="landing-metric-item">
          <div class="landing-metric-icon"><i class="fa-solid fa-star" style="color: #F59E0B;"></i></div>
          <div>
            <div class="landing-metric-val">4.98 / 5.0 VIP</div>
            <div class="landing-metric-lbl">Satisfacción de clientes élite</div>
          </div>
        </div>
      </div>
    </section>

    <!-- SECCIÓN SCROLLYTELLING INTERACTIVA (CAPÍTULO 1 & 2) -->
    <section class="scrolly-section" id="scrolly-chapter">
      <div class="scrolly-header">
        <span class="scrolly-eyebrow">ARQUITECTURA DE VANGUARDIA</span>
        <h2 class="scrolly-title">Cómo FAMILIA 1969 Revoluciona la Experiencia</h2>
        <p style="color: #94A3B8; max-width: 600px; margin: 12px auto 0; font-size: 15px;">
          Desliza para explorar cómo se integran el WhatsApp directo, la seguridad criptográfica y el motor de asignación automática de citas.
        </p>
      </div>

      <div class="scrolly-grid">
        
        <!-- COLUMNA IZQUIERDA: STAGE VISUAL STICKY CONMUTABLE -->
        <div class="scrolly-sticky-stage" id="scrolly-stage">
          <div class="scrolly-stage-topbar">
            <div class="scrolly-stage-pill" id="stage-active-badge">
              <i class="fa-solid fa-circle-dot fa-spin"></i> <span id="stage-badge-text">ESCENA 1 &bull; WHATSAPP DIRECTO</span>
            </div>
            <div class="scrolly-step-indicators">
              <div class="scrolly-dot active" onclick="activateScrollyStep(1)"></div>
              <div class="scrolly-dot" onclick="activateScrollyStep(2)"></div>
              <div class="scrolly-dot" onclick="activateScrollyStep(3)"></div>
              <div class="scrolly-dot" onclick="activateScrollyStep(4)"></div>
            </div>
          </div>

          <!-- ESCENA 1: MOCKUP DE WHATSAPP OFICIAL DIRECTO -->
          <div class="scrolly-scene active" id="scene-1">
            <div class="mock-chat-card">
              <div class="mock-chat-header">
                <div class="mock-chat-avatar"><i class="fa-solid fa-scissors"></i></div>
                <div>
                  <div style="font-weight: 800; font-size: 13.5px; display: flex; align-items: center; gap: 5px;">
                    Johan Master Barber <i class="fa-solid fa-circle-check" style="color: #38BDF8; font-size: 12px;"></i>
                  </div>
                  <div style="font-size: 10px; opacity: 0.85;">FAMILIA 1969 &bull; En línea</div>
                </div>
              </div>
              <div class="mock-chat-body">
                <div class="mock-chat-bubble">
                  <div style="font-weight: 700; color: #34D399; margin-bottom: 4px;">✂️ Confirmación Oficial de Cita</div>
                  ¡Hola Carlos! Tu reserva para <strong>Corte Clásico & Fade Texturizado</strong> quedó agendada con tu barbero Johan para hoy a las <strong>4:00 PM</strong>.
                  <div class="mock-chat-time">10:42 AM &bull; <i class="fa-solid fa-check-double" style="color: #38BDF8;"></i></div>
                </div>
                <div style="background: rgba(56, 189, 248, 0.08); border: 1px dashed rgba(56, 189, 248, 0.3); border-radius: 10px; padding: 10px; font-size: 11.5px; color: #94A3B8; text-align: center;">
                  <i class="fa-solid fa-arrow-pointer" style="color: #38BDF8;"></i> Cliente y barbero conectados directamente a través de sus números personales verificados.
                </div>
              </div>
            </div>
          </div>

          <!-- ESCENA 2: MOCKUP DE CRIPTOGRAFÍA Y PRIVACIDAD NIST -->
          <div class="scrolly-scene" id="scene-2">
            <div class="mock-vault-card">
              <div class="mock-shield-icon">
                <i class="fa-solid fa-lock"></i>
              </div>
              <div style="font-weight: 900; font-size: 16px; color: #FFF; margin-bottom: 4px;">BLINDAJE NIST SCRYPT v2</div>
              <div style="font-size: 12px; color: #94A3B8;">Anonimización dinámica y protección de datos VIP</div>

              <div class="mock-cipher-box">
                <div>CLIENT_NAME: Carlos M.</div>
                <div>PHONE_HASH: +57 312 *** 8901 [PROTEGIDO]</div>
                <div>ALGORITHM : NIST SP 800-132 scrypt</div>
                <div>STATUS    : 100% BLINDADO CONTRA FUGAS</div>
              </div>

              <div style="display: flex; justify-content: center; gap: 8px;">
                <span style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34D399; font-size: 11px; padding: 3px 10px; border-radius: 12px; font-weight: 700;">
                  ✓ Cero Texto Plano
                </span>
                <span style="background: rgba(56, 189, 248, 0.15); border: 1px solid rgba(56, 189, 248, 0.4); color: #38BDF8; font-size: 11px; padding: 3px 10px; border-radius: 12px; font-weight: 700;">
                  ✓ Verificación &lt; 25ms
                </span>
              </div>
            </div>
          </div>

          <!-- ESCENA 3: MOCKUP DE CONTROL ADMINISTRADOR RBAC -->
          <div class="scrolly-scene" id="scene-3">
            <div class="mock-admin-card">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
                <div style="font-weight: 800; font-size: 14px; color: #F59E0B; display: flex; align-items: center; gap: 6px;">
                  <i class="fa-solid fa-crown"></i> Panel Maestro de Control
                </div>
                <span style="font-size: 10.5px; background: rgba(245, 158, 11, 0.15); color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.4); padding: 2px 8px; border-radius: 10px; font-weight: 800;">
                  ADMINISTRADOR
                </span>
              </div>

              <div class="mock-barber-row">
                <div>
                  <div style="font-weight: 800; font-size: 12.5px; color: #FFF;">Mateo Ruiz</div>
                  <div style="font-size: 10px; color: #94A3B8;">Solicitud Registro &bull; +57 300 456 7890</div>
                </div>
                <button onclick="openAuthModal('login')" class="landing-btn landing-btn-gold" style="padding: 4px 10px; font-size: 10.5px;">
                  <i class="fa-solid fa-check"></i> Activar
                </button>
              </div>

              <div class="mock-barber-row" style="opacity: 0.85;">
                <div>
                  <div style="font-weight: 800; font-size: 12.5px; color: #FFF;">Johan Morales</div>
                  <div style="font-size: 10px; color: #10B981;">🟢 Activo &bull; Master Barber</div>
                </div>
                <span style="font-size: 10.5px; color: #10B981; font-weight: 700;">Verificado</span>
              </div>
            </div>
          </div>

          <!-- ESCENA 4: MOCKUP DE AGENDA INTELIGENTE -->
          <div class="scrolly-scene" id="scene-4">
            <div class="mock-schedule-card">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="font-weight: 800; font-size: 13.5px; color: #38BDF8;">
                  <i class="fa-solid fa-calendar-check"></i> Matriz de Turnos en Vivo
                </div>
                <span style="font-size: 10px; color: #94A3B8;">Algoritmo Anti-Colisión</span>
              </div>

              <div class="mock-slot-grid">
                <div class="mock-slot occupied">
                  <span>10:00 AM</span>
                  <i class="fa-solid fa-user"></i>
                </div>
                <div class="mock-slot available">
                  <span>10:45 AM</span>
                  <span>LIBRE</span>
                </div>
                <div class="mock-slot available">
                  <span>11:30 AM</span>
                  <span>LIBRE</span>
                </div>
                <div class="mock-slot occupied">
                  <span>12:15 PM</span>
                  <i class="fa-solid fa-utensils"></i>
                </div>
              </div>

              <div style="margin-top: 14px; text-align: center;">
                <button onclick="showAppView()" class="landing-btn landing-btn-sapphire" style="width: 100%; padding: 8px; font-size: 12px;">
                  <i class="fa-solid fa-bolt"></i> Abrir Selector de Horarios en Vivo
                </button>
              </div>
            </div>
          </div>

        </div>

        <!-- COLUMNA DERECHA: FLUJO NARRATIVO SCROLLYTELLING -->
        <div class="scrolly-narrative">

          <!-- PASO 1 -->
          <div class="scrolly-step active" data-step="1" onclick="activateScrollyStep(1)">
            <span class="scrolly-step-num"><i class="fa-brands fa-whatsapp" style="color: #25D366;"></i> CAPÍTULO 01 &bull; COMUNICACIÓN DIRECTA</span>
            <h3 class="scrolly-step-title">Cada Barbero Dueño de su WhatsApp Oficial</h3>
            <p class="scrolly-step-desc">
              Eliminamos el modelo tradicional donde el dueño de la barbería retiene los contactos y desvía la clientela. En FAMILIA 1969, cada barbero registra su número oficial.
            </p>
            <ul class="scrolly-feature-list">
              <li class="scrolly-feature-item"><i class="fa-solid fa-check"></i> Confirmaciones automáticas enviadas desde el WhatsApp personal del barbero.</li>
              <li class="scrolly-feature-item"><i class="fa-solid fa-check"></i> Recordatorios de corte que fidelizan a tu propia cartera de clientes.</li>
              <li class="scrolly-feature-item"><i class="fa-solid fa-check"></i> Cambio instantáneo de número en cualquier momento con un clic.</li>
            </ul>
            <button onclick="openAuthModal('register')" class="landing-btn landing-btn-sapphire" style="font-size: 12px; padding: 7px 16px;">
              <i class="fa-solid fa-scissors"></i> Registrar mi WhatsApp de Barbero
            </button>
          </div>

          <!-- PASO 2 -->
          <div class="scrolly-step" data-step="2" onclick="activateScrollyStep(2)">
            <span class="scrolly-step-num" id="security-chapter"><i class="fa-solid fa-shield-halved"></i> CAPÍTULO 02 &bull; BLINDAJE CRIPTOGRÁFICO</span>
            <h3 class="scrolly-step-title">Privacidad Criptográfica Grado Militar NIST</h3>
            <p class="scrolly-step-desc">
              Tus clientes VIP exigen discreción absoluta. Toda la información sensible y números de contacto se procesan con enmascaramiento dinámico y hashing bajo los estándares NIST SP 800-132.
            </p>
            <ul class="scrolly-feature-list">
              <li class="scrolly-feature-item"><i class="fa-solid fa-check"></i> Cero contraseñas ni datos en texto plano en bases de datos.</li>
              <li class="scrolly-feature-item"><i class="fa-solid fa-check"></i> Enmascaramiento activo contra miradas curiosas (+57 312 *** 8901).</li>
              <li class="scrolly-feature-item"><i class="fa-solid fa-check"></i> Motor criptográfico con latencia ultra rápida de apenas 23 milisegundos.</li>
            </ul>
            <button onclick="openAuthModal('login')" class="landing-btn landing-btn-outline" style="font-size: 12px; padding: 7px 16px;">
              <i class="fa-solid fa-lock"></i> Probar Ingreso Protegido
            </button>
          </div>

          <!-- PASO 3 -->
          <div class="scrolly-step" data-step="3" onclick="activateScrollyStep(3)">
            <span class="scrolly-step-num"><i class="fa-solid fa-crown" style="color: #F59E0B;"></i> CAPÍTULO 03 &bull; CONTROL MAESTRO & CALIDAD</span>
            <h3 class="scrolly-step-title">Aprobación Rigurosa por el Administrador Master</h3>
            <p class="scrolly-step-desc">
              Cualquier profesional puede enviar su solicitud de registro, pero la reputación de FAMILIA 1969 es inquebrantable: ningún barbero puede recibir citas hasta que el Administrador evalúe y active su perfil.
            </p>
            <ul class="scrolly-feature-list">
              <li class="scrolly-feature-item"><i class="fa-solid fa-check"></i> Panel de control centralizado con métricas globales del Club.</li>
              <li class="scrolly-feature-item"><i class="fa-solid fa-check"></i> Activación o suspensión inmediata de cuentas con un toque.</li>
              <li class="scrolly-feature-item"><i class="fa-solid fa-check"></i> Auditoría de citas, facturación y caja diaria por barbero.</li>
            </ul>
            <button onclick="openAuthModal('login')" class="landing-btn landing-btn-gold" style="font-size: 12px; padding: 7px 16px;">
              <i class="fa-solid fa-crown"></i> Acceso Administrador Master
            </button>
          </div>

          <!-- PASO 4 -->
          <div class="scrolly-step" data-step="4" onclick="activateScrollyStep(4)">
            <span class="scrolly-step-num"><i class="fa-solid fa-calendar-check"></i> CAPÍTULO 04 &bull; INTELIGENCIA DE TURNOS</span>
            <h3 class="scrolly-step-title">Agenda Dinámica Sin Esperas ni Colisiones</h3>
            <p class="scrolly-step-desc">
              Nuestro motor de disponibilidad calcula en tiempo real descansos, solapamientos y tiempos de servicio por barbero individual. El cliente reserva en menos de 20 segundos.
            </p>
            <ul class="scrolly-feature-list">
              <li class="scrolly-feature-item"><i class="fa-solid fa-check"></i> Selección directa del barbero de preferencia del cliente.</li>
              <li class="scrolly-feature-item"><i class="fa-solid fa-check"></i> Visualización de turnos libres en bloques optimizados de tiempo.</li>
              <li class="scrolly-feature-item"><i class="fa-solid fa-check"></i> Sincronización instantánea en la nube para todo el equipo.</li>
            </ul>
            <button onclick="showAppView()" class="landing-btn landing-btn-gold" style="font-size: 12px; padding: 7px 16px;">
              <i class="fa-solid fa-calendar-day"></i> Ver Agenda en Vivo
            </button>
          </div>

        </div>

      </div>
    </section>

    <!-- VITRINA DE SERVICIOS VIP (CAPÍTULO 3) -->
    <section class="services-showcase-section" id="services-chapter">
      <div style="text-align: center; margin-bottom: 20px;">
        <span class="scrolly-eyebrow">CATÁLOGO DE AUTOR</span>
        <h2 class="scrolly-title">Nuestros Rituales Exclusivos</h2>
        <p style="color: #94A3B8; max-width: 620px; margin: 10px auto 0; font-size: 15px;">
          Cada servicio incluye perfilado de visagismo, productos premium importados y toallas tibias aromatizadas.
        </p>
      </div>

      <div class="services-grid">
        
        <!-- SERVICIO 1 -->
        <div class="vip-service-card">
          <div>
            <div style="color: #38BDF8; font-size: 24px; margin-bottom: 12px;"><i class="fa-solid fa-scissors"></i></div>
            <h4 style="font-size: 18px; font-weight: 800; color: #FFF; margin-bottom: 6px;">Corte Clásico & Fade Texturizado</h4>
            <p style="font-size: 12.5px; color: #94A3B8; line-height: 1.5;">
              Corte a tijera y máquina con degradado impecable, lavado con shampoo de eucalipto y peinado con cera mate.
            </p>
          </div>
          <div>
            <div class="vip-service-price">$35.000 <span style="font-size: 12px; color: #94A3B8; font-weight: 600;">/ 45 min</span></div>
            <button onclick="selectServiceAndGoToApp('srv-1', 'Corte Clásico & Fade Texturizado')" class="landing-btn landing-btn-outline" style="width: 100%; font-size: 12px;">
              <i class="fa-solid fa-calendar-plus"></i> Reservar Este Corte
            </button>
          </div>
        </div>

        <!-- SERVICIO 2 -->
        <div class="vip-service-card">
          <div>
            <div style="color: #38BDF8; font-size: 24px; margin-bottom: 12px;"><i class="fa-solid fa-spray-can"></i></div>
            <h4 style="font-size: 18px; font-weight: 800; color: #FFF; margin-bottom: 6px;">Ritual Barba Imperial</h4>
            <p style="font-size: 12.5px; color: #94A3B8; line-height: 1.5;">
              Vapor de ozono, exfoliación profunda, toalla caliente emoliente, afeitado tradicional a navaja y bálsamo hidratante.
            </p>
          </div>
          <div>
            <div class="vip-service-price">$25.000 <span style="font-size: 12px; color: #94A3B8; font-weight: 600;">/ 35 min</span></div>
            <button onclick="selectServiceAndGoToApp('srv-2', 'Ritual Barba Imperial')" class="landing-btn landing-btn-outline" style="width: 100%; font-size: 12px;">
              <i class="fa-solid fa-calendar-plus"></i> Reservar Barba
            </button>
          </div>
        </div>

        <!-- SERVICIO 3 (FEATURED) -->
        <div class="vip-service-card featured">
          <div class="vip-badge">MÁS SOLICITADO</div>
          <div>
            <div style="color: #F59E0B; font-size: 24px; margin-bottom: 12px;"><i class="fa-solid fa-crown"></i></div>
            <h4 style="font-size: 18px; font-weight: 800; color: #FFF; margin-bottom: 6px;">Combo VIP Familia 1969</h4>
            <p style="font-size: 12.5px; color: #94A3B8; line-height: 1.5;">
              La experiencia integral: Corte de autor + Ritual de barba completo + Mascarilla purificante de carbón activado y masaje capilar.
            </p>
          </div>
          <div>
            <div class="vip-service-price">$55.000 <span style="font-size: 12px; color: #94A3B8; font-weight: 600;">/ 75 min</span></div>
            <button onclick="selectServiceAndGoToApp('srv-3', 'Combo VIP Familia 1969')" class="landing-btn landing-btn-gold" style="width: 100%; font-size: 12px;">
              <i class="fa-solid fa-gem"></i> Reservar Experiencia VIP
            </button>
          </div>
        </div>

        <!-- SERVICIO 4 -->
        <div class="vip-service-card">
          <div>
            <div style="color: #38BDF8; font-size: 24px; margin-bottom: 12px;"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
            <h4 style="font-size: 18px; font-weight: 800; color: #FFF; margin-bottom: 6px;">Perfilado & Navaja Tradicional</h4>
            <p style="font-size: 12.5px; color: #94A3B8; line-height: 1.5;">
              Marcado de contornos con navaja japonesa de máxima precisión, delineado de barba y cejas y loción refrescante de sándalo.
            </p>
          </div>
          <div>
            <div class="vip-service-price">$18.000 <span style="font-size: 12px; color: #94A3B8; font-weight: 600;">/ 25 min</span></div>
            <button onclick="selectServiceAndGoToApp('srv-4', 'Perfilado & Navaja Tradicional')" class="landing-btn landing-btn-outline" style="width: 100%; font-size: 12px;">
              <i class="fa-solid fa-calendar-plus"></i> Reservar Perfilado
            </button>
          </div>
        </div>

      </div>
    </section>

    <!-- GRAN BANNER DE CONVERSIÓN FINAL (CAPÍTULO 4) -->
    <div class="landing-cta-banner">
      <div style="font-size: 12px; font-weight: 800; letter-spacing: 2px; color: #F59E0B; text-transform: uppercase; margin-bottom: 12px;">
        ✦ ÚNETE AL CLUB MÁS EXCLUSIVO ✦
      </div>
      <h2 class="landing-cta-title">¿Listo para Vivir la Experiencia FAMILIA 1969?</h2>
      <p class="landing-cta-desc">
        Agenda tu cita con tu barbero favorito en segundos, o regístrate como barbero independiente para gestionar tu clientela y recibir citas directamente en tu WhatsApp.
      </p>

      <div style="display: flex; justify-content: center; gap: 14px; flex-wrap: wrap;">
        <button onclick="showAppView()" class="landing-btn landing-btn-gold landing-btn-hero-main">
          <i class="fa-solid fa-calendar-check"></i>
          <span>Agendar Cita Ahora</span>
        </button>
        <button onclick="openAuthModal('register')" class="landing-btn landing-btn-sapphire landing-btn-hero-main">
          <i class="fa-brands fa-whatsapp" style="color: #25D366; font-size: 18px;"></i>
          <span>Registrarme como Barbero</span>
        </button>
        <button onclick="openAuthModal('login')" class="landing-btn landing-btn-outline landing-btn-hero-main">
          <i class="fa-solid fa-lock"></i>
          <span>Iniciar Sesión</span>
        </button>
      </div>
    </div>

    <!-- FOOTER ELEGANTE -->
    <footer class="landing-footer">
      <div style="display: flex; justify-content: center; align-items: center; gap: 10px; margin-bottom: 14px;">
        <img src="/assets/brand/familia1969-badge-blue.png" alt="FAMILIA 1969" style="width: 28px; height: 28px;">
        <span style="font-weight: 900; color: #FFF; font-size: 14px; letter-spacing: 1px;">FAMILIA 1969 BARBER CLUB</span>
      </div>
      <p style="margin: 0 0 10px 0;">
        Carrera 15 # 85-32, Zona Rosa &bull; Bogotá, Colombia &bull; WhatsApp Concierge: +57 312 345 6789
      </p>
      <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 14px;">
        <a href="javascript:void(0)" onclick="openAuthModal('login')" style="color: #38BDF8; text-decoration: none;">Acceso Barberos</a>
        <a href="javascript:void(0)" onclick="openAuthModal('register')" style="color: #38BDF8; text-decoration: none;">Registro de Barberos</a>
        <a href="javascript:void(0)" onclick="showAppView()" style="color: #F59E0B; text-decoration: none;">Sistema de Reservas</a>
      </div>
      <p style="margin: 0; opacity: 0.6; font-size: 11px;">
        &copy; 2026 FAMILIA 1969 Barber Club. Todos los derechos reservados. Blindaje Criptográfico NIST scrypt v2.
      </p>
    </footer>

  </div>
  <!-- FIN VISTA 1: LANDING PAGE SCROLLYTELLING -->
"""

# ==============================================================================
# 3. JAVASCRIPT DE INTEGRACIÓN & SCROLLYTELLING
# ==============================================================================
landing_js = """
    // =========================================================================
    // CONTROLADOR DE VISTAS (LANDING PAGE SCROLLYTELLING vs SISTEMA SAAS)
    // =========================================================================
    function showLandingView() {
      const landing = document.getElementById('landing-view');
      const app = document.getElementById('app-view');
      if (landing) landing.style.display = 'block';
      if (app) app.style.display = 'none';
      document.body.classList.add('is-landing-view');
      localStorage.setItem('fam1969_preferred_view', 'landing');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function showAppView() {
      const landing = document.getElementById('landing-view');
      const app = document.getElementById('app-view');
      if (landing) landing.style.display = 'none';
      if (app) app.style.display = 'contents';
      document.body.classList.remove('is-landing-view');
      localStorage.setItem('fam1969_preferred_view', 'app');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (typeof loadDashboardData === 'function') {
        loadDashboardData();
      }
      if (typeof loadActiveBarbersSelector === 'function') {
        loadActiveBarbersSelector();
      }
    }

    function selectServiceAndGoToApp(serviceId, serviceName) {
      showAppView();
      setTimeout(() => {
        if (typeof openNewBookingSheet === 'function') {
          openNewBookingSheet();
          const svcSelect = document.getElementById('booking-service-select');
          if (svcSelect) {
            for (let i = 0; i < svcSelect.options.length; i++) {
              if (svcSelect.options[i].value === serviceId || svcSelect.options[i].text.includes(serviceName)) {
                svcSelect.selectedIndex = i;
                break;
              }
            }
          }
        }
      }, 350);
    }

    // =========================================================================
    // LÓGICA INTERACTIVA SCROLLYTELLING CON OBSERVER
    // =========================================================================
    const SCROLLY_TITLES = {
      1: 'ESCENA 1 • WHATSAPP DIRECTO',
      2: 'ESCENA 2 • PRIVACIDAD NIST',
      3: 'ESCENA 3 • CONTROL MAESTRO',
      4: 'ESCENA 4 • AGENDA INTELIGENTE'
    };

    function activateScrollyStep(stepNum) {
      // Activar escena en el stage sticky
      for (let i = 1; i <= 4; i++) {
        const scene = document.getElementById('scene-' + i);
        if (scene) scene.classList.toggle('active', i === stepNum);
      }

      // Actualizar dots
      const dots = document.querySelectorAll('.scrolly-dot');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx + 1 === stepNum);
      });

      // Actualizar badge
      const badgeText = document.getElementById('stage-badge-text');
      if (badgeText && SCROLLY_TITLES[stepNum]) {
        badgeText.textContent = SCROLLY_TITLES[stepNum];
      }

      // Actualizar tarjetas en columna narrativa
      const steps = document.querySelectorAll('.scrolly-step');
      steps.forEach(step => {
        const stepAttr = parseInt(step.getAttribute('data-step') || '0', 10);
        step.classList.toggle('active', stepAttr === stepNum);
      });
    }

    function initLandingScrollytelling() {
      const stepElements = document.querySelectorAll('.scrolly-step');
      if (!stepElements.length) return;

      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const step = parseInt(entry.target.getAttribute('data-step') || '1', 10);
              activateScrollyStep(step);
            }
          });
        }, {
          root: null,
          rootMargin: '-30% 0px -40% 0px',
          threshold: 0.1
        });

        stepElements.forEach(el => observer.observe(el));
      }
    }

    // Comprobación de vista inicial al cargar
    function checkInitialViewRouting() {
      const urlParams = new URLSearchParams(window.location.search);
      const viewParam = urlParams.get('view');
      const token = localStorage.getItem('fam1969_token');
      const pref = localStorage.getItem('fam1969_preferred_view');

      if (viewParam === 'app') {
        showAppView();
      } else if (viewParam === 'landing') {
        showLandingView();
      } else if (token) {
        // Usuario logueado (barbero o admin) entra directo al sistema
        showAppView();
      } else if (pref === 'app') {
        showAppView();
      } else {
        // Por primera vez o usuario no logueado: LANDING SCROLLYTELLING
        showLandingView();
      }

      initLandingScrollytelling();
    }
"""

print("Starting injection into index.html...")

# 1. Insert CSS before </head>
if "familia1969-landing-styles" not in html:
    html = html.replace('</head>', landing_css + '\n</head>', 1)
    print("[OK] Landing CSS injected before </head>")
else:
    print("Landing CSS already present, skipping.")

# 2. Insert Landing View right after <body>
if 'id="landing-view"' not in html:
    body_tag_match = re.search(r'<body[^>]*>', html)
    if body_tag_match:
        end_body_tag = body_tag_match.end()
        html = html[:end_body_tag] + '\n' + landing_html + '\n' + html[end_body_tag:]
        print("[OK] Landing HTML inserted right after <body>")
else:
    print("id='landing-view' already present, skipping.")

# 3. Wrap App in #app-view
if 'id="app-view"' not in html:
    app_root_comment = '<!-- CONTENEDOR PRINCIPAL: SISTEMA WEB DE GESTIÓN (SAAS DESKTOP) -->'
    idx_app_root = html.find(app_root_comment)
    
    # Bottom nav close
    idx_bottom_nav = html.find('class="mobile-bottom-nav"')
    idx_bottom_nav_close = html.find('</nav>', idx_bottom_nav) + len('</nav>')

    if idx_app_root != -1 and idx_bottom_nav_close != -1:
        part1 = html[:idx_app_root]
        wrapped_part = '<!-- ====================================================================== -->\n' \
                       '  <!-- VISTA 2: SISTEMA WEB SAAS DE GESTIÓN & AGENDAMIENTO                   -->\n' \
                       '  <!-- ====================================================================== -->\n' \
                       '  <div id="app-view" style="display: none;">\n' + \
                       html[idx_app_root:idx_bottom_nav_close] + \
                       '\n  </div><!-- FIN VISTA 2: SISTEMA SAAS -->\n'
        part3 = html[idx_bottom_nav_close:]
        html = part1 + wrapped_part + part3
        print("[OK] App wrapped in #app-view (display: none by default)")
    else:
        print("Could not find wrap bounds for #app-view!")
else:
    print("id='app-view' already present, skipping.")

# 4. Inject Landing button in App Topbar
topbar_landing_btn = """
          <!-- Botón de Conmutación a Landing / Club -->
          <button class="desktop-btn desktop-btn-surface" onclick="showLandingView()" title="Ver Presentación / Conocer Más de FAMILIA 1969" style="border-color: rgba(56, 189, 248, 0.4); background: rgba(14, 23, 44, 0.9);">
            <i class="fa-solid fa-compass" style="color: #38BDF8;"></i>
            <span class="btn-text-full">Club / Landing</span>
          </button>
"""
if 'onclick="showLandingView()"' not in html:
    # Insert right before class="topbar-actions"
    actions_idx = html.find('<div class="topbar-actions">')
    if actions_idx != -1:
        inner_idx = actions_idx + len('<div class="topbar-actions">')
        html = html[:inner_idx] + '\n' + topbar_landing_btn + '\n' + html[inner_idx:]
        print("[OK] Landing button added to desktop-topbar")
else:
    print("showLandingView() already in topbar, skipping.")

# 5. Inject Landing item in App Sidebar
sidebar_landing_item = """
        <div class="nav-item" onclick="showLandingView()" title="Conocer más sobre el Club y Sistema">
          <div class="nav-icon-wrap"><i class="fa-solid fa-compass" style="color: #38BDF8;"></i></div>
          <span class="nav-item-text">Presentación / Club</span>
        </div>
"""
if 'onclick="showLandingView()"' in html and 'nav-item-text">Presentación / Club</span>' not in html:
    sidebar_nav_end = html.find('</nav>', html.find('class="sidebar-nav"'))
    if sidebar_nav_end != -1:
        html = html[:sidebar_nav_end] + sidebar_landing_item + '\n' + html[sidebar_nav_end:]
        print("[OK] Landing item added to sidebar-nav")

# 6. Inject JS in scripts
if "checkInitialViewRouting" not in html:
    idx_check_auth = html.find('async function checkAuthOnLoad()')
    if idx_check_auth != -1:
        html = html[:idx_check_auth] + landing_js + '\n\n    ' + html[idx_check_auth:]
        print("[OK] Landing JS methods injected before checkAuthOnLoad")
    
    # Also hook into window.onload
    html = html.replace('checkAuthOnLoad();', 'checkAuthOnLoad();\n      checkInitialViewRouting();', 1)
    print("[OK] Hooked checkInitialViewRouting() into window.onload")

    # In setAuthSession, switch to app view automatically
    html = html.replace('function setAuthSession(token, user) {\n      currentAuthToken = token;',
                        'function setAuthSession(token, user) {\n      currentAuthToken = token;\n      showAppView();', 1)
    print("[OK] setAuthSession updated to trigger showAppView()")

# Save to index.html and public/index.html
with open(INDEX_PATH, 'w', encoding='utf-8') as f:
    f.write(html)
print(f"[OK] Saved updated {INDEX_PATH}")

with open(PUBLIC_INDEX_PATH, 'w', encoding='utf-8') as f:
    f.write(html)
print(f"[OK] Saved updated {PUBLIC_INDEX_PATH}")
print("ALL DONE SUCCESSFULLY!")
