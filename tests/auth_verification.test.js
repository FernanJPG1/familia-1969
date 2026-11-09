const assert = require('assert');
const { createApp } = require('../dist/app');

async function runTests() {
  console.log('--- TEST: AUTH 2-STEP VERIFICATION (EMAIL & WHATSAPP) ---');
  const app = createApp();
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = 'http://localhost:' + port;

  try {
    // 1. Registro de nuevo barbero
    const testEmail = 'barbero_test_' + Date.now() + '@test.com';
    const regRes = await fetch(baseUrl + '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Carlos Barbero',
        phone: '+57 300 987 6543',
        email: testEmail,
        password: 'Password123*'
      })
    });
    assert.strictEqual(regRes.status, 201, 'Registro debe responder 201');
    const regData = await regRes.json();
    assert.strictEqual(regData.requiresVerification, true, 'Debe requerir verificación');
    assert(regData.userId, 'Debe retornar userId');
    assert(regData.emailCodePreview, 'Debe retornar emailCodePreview');
    assert(regData.phoneCodePreview, 'Debe retornar phoneCodePreview');
    console.log('✓ Registro exitoso con códigos:', regData.emailCodePreview, regData.phoneCodePreview);

    // 2. Intentar login antes de verificar
    const preLoginRes = await fetch(baseUrl + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'Password123*' })
    });
    assert.strictEqual(preLoginRes.status, 403, 'Login no verificado debe responder 403');
    const preLoginData = await preLoginRes.json();
    assert.strictEqual(preLoginData.requiresVerification, true, 'Login debe indicar requiresVerification: true');
    console.log('✓ Intento de login antes de verificar rechazado con requiresVerification: true');

    // 3. Intento de verificación con código erróneo
    const badVerifyRes = await fetch(baseUrl + '/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: regData.userId,
        emailCode: '000000',
        phoneCode: '000000'
      })
    });
    assert.strictEqual(badVerifyRes.status, 400, 'Verificación errónea debe responder 400');
    console.log('✓ Código erróneo rechazado correctamente');

    // 4. Verificación con códigos correctos
    const goodVerifyRes = await fetch(baseUrl + '/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: regData.userId,
        emailCode: regData.emailCodePreview,
        phoneCode: regData.phoneCodePreview
      })
    });
    assert.strictEqual(goodVerifyRes.status, 200, 'Verificación correcta debe responder 200');
    const verifyData = await goodVerifyRes.json();
    assert(verifyData.token, 'Debe retornar JWT token');
    assert.strictEqual(verifyData.user.isEmailVerified, true, 'isEmailVerified debe ser true');
    assert.strictEqual(verifyData.user.isPhoneVerified, true, 'isPhoneVerified debe ser true');
    assert.strictEqual(verifyData.user.status, 'active', 'Estado debe ser active');
    console.log('✓ Verificación de 2 pasos completada exitosamente');

    // 5. Login después de verificar
    const postLoginRes = await fetch(baseUrl + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'Password123*' })
    });
    assert.strictEqual(postLoginRes.status, 200, 'Login después de verificar debe ser 200');
    const postLoginData = await postLoginRes.json();
    assert(postLoginData.token, 'Debe retornar token tras login');
    console.log('✓ Login directo exitoso para cuenta verificada');

    // 6. Login de Administrador Master (siempre activo y verificado)
    const adminLoginRes = await fetch(baseUrl + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@familia1969.com', password: 'FamiliaAdmin1969*' })
    });
    assert.strictEqual(adminLoginRes.status, 200, 'Admin master debe autenticar 200');
    const adminData = await adminLoginRes.json();
    assert.strictEqual(adminData.user.role, 'admin', 'Rol debe ser admin');
    console.log('✓ Admin Master autentica sin bloqueos');

    console.log('TODAS LAS PRUEBAS DE VERIFICACIÓN 2-PASOS PASARON CON ÉXITO [100% OK]');
  } finally {
    server.close();
  }
}

runTests().catch(err => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
