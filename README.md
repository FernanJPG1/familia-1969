# 💈 Barbería SaaS, App Móvil Android & WhatsApp Bot • Mateo Silva Studio

Sistema profesional y modular de gestión para barbería con **Clean Architecture**, motor de disponibilidad en tiempo real, **App Móvil nativa en Flutter (APK descargable)**, **Acceso Web / PWA multiplataforma** y **Chatbot conversacional de WhatsApp** con Inteligencia de Lenguaje Natural (NLU).

---

## 📱 Despliegue y Modos de Acceso

La aplicación cuenta con 3 canales de acceso profesional:

### 1. 🌐 Sitio Web & App de Gestión (Acceso Inmediato)
* **URL Local:** [http://localhost:3000](http://localhost:3000)
* Funciona en cualquier navegador de PC, Mac, tablet o celular.
* Incluye agenda visual, métricas de ingresos, gestión de cortes en tiempo real, configuración y simulador interactivo de WhatsApp.

### 2. 🤖 Descarga Directa del APK para Celulares Android
* **Archivo compilado:** [`public/downloads/Barberia-MateoSilva.apk`](file:///c:/Users/Usuario/Desktop/Barberia/public/downloads/Barberia-MateoSilva.apk)
* **Enlace directo de descarga:** [http://localhost:3000/downloads/Barberia-MateoSilva.apk](http://localhost:3000/downloads/Barberia-MateoSilva.apk)
* Los clientes o el barbero pueden pulsar el botón **"📥 Descargar APK (Android)"** desde la barra superior o en la pestaña *Ajustes* para instalarla directamente en cualquier dispositivo Android.

### 3. 📲 Progressive Web App (PWA)
* Se puede instalar en la pantalla de inicio de **iPhone (iOS)**, **Android** y **computadoras** sin pasar por tiendas.
* Solo pulsa **"Instalar Web App"** en el navegador para que se comporte como una aplicación nativa.

---

## 🛠️ Configuración en Android Studio & Toolchain

Android Studio y el entorno de compilación quedaron 100% operativos:
* **Android Studio:** Instalado y abierto en `c:\Users\Usuario\Desktop\Barberia\mobile_app\android`.
* **Android SDK:** Versión 36 y 35 configuradas y con licencias aceptadas.
* **Command-line Tools:** Instalado en `C:\Users\Usuario\AppData\Local\Android\Sdk\cmdline-tools\latest`.
* **CMake & NDK:** `CMake 3.22.1` y `NDK 28.2` listos.
* **Flutter:** `Flutter 3.44.6` con soporte para Android y Web verificado con `flutter doctor`.

---

## 🏗️ Estructura del Backend (Clean Architecture)

```
src/
├── config/                      # Variables de entorno y constantes de negocio
│   ├── env.ts                  # Validación de variables (.env) con fallbacks
│   └── constants.ts            # Zona horaria (America/Bogota), descansos y colores
├── core/                        # Dominio puro e invariantes de negocio
│   ├── errors/app-error.ts     # Errores estándar HTTP (400, 404, 409, 500)
│   ├── types/                  # Modelos del dominio y de WhatsApp
│   └── utils/                  # Aritmética exacta de fechas, semáforo mutex y eventos
├── database/                    # Almacén de datos persistente y seeders
├── middlewares/                 # Interceptores y manejador centralizado de errores
├── modules/                     # Módulos de negocio (Controlador + Servicio + Rutas)
│   ├── appointments/           # Citas manuales, cambio de estado y recordatorios
│   ├── availability/           # Cálculo de slots libres, recesos y buffers
│   ├── dashboard/              # Agenda diaria, métricas de ocupación e ingresos
│   ├── services/               # CRUD de catálogo de cortes y rituales
│   ├── settings/               # Ajustes de horario, almuerzos, buffers y bot
│   └── whatsapp/               # Bot FSM, NLU de intenciones y webhooks Meta
├── routes/                      # Enrutador raíz `/api`
├── app.ts                       # Fábrica de Express configurada
└── server.ts                    # Servidor HTTP y Socket.IO en tiempo real
```

---

## ⚡ Comandos Rápidos

```bash
# Compilar TypeScript
npm run build

# Ejecutar las pruebas unitarias e integración (5/5 pasadas)
npm test

# Iniciar servidor backend y frontend web
npm start

# Compilar de nuevo el APK de Flutter
cd mobile_app
flutter build apk --debug
```
