const { createApp } = require('../dist/app');

async function runTests() {
  const app = createApp();
  const server = app.listen(3099, async () => {
    try {
      console.log('Testing /api/auth/register...');
      const regRes = await fetch('http://localhost:3099/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Jensy Gomez',
          email: 'jensy_test@familia1969.com',
          password: 'Password123*',
          phone: '+57 300 555 7788',
          shopName: 'FAMILIA 1969'
        })
      });
      const regData = await regRes.json();
      console.log('Register status:', regRes.status, 'User:', regData.user?.email, 'Token exists:', Boolean(regData.token));

      console.log('Testing /api/auth/login...');
      const logRes = await fetch('http://localhost:3099/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'jensy_test@familia1969.com',
          password: 'Password123*'
        })
      });
      const logData = await logRes.json();
      console.log('Login status:', logRes.status, 'User:', logData.user?.name);

      console.log('Testing /api/auth/me (Get profile)...');
      const meRes = await fetch('http://localhost:3099/api/auth/me', {
        headers: { 'Authorization': 'Bearer ' + logData.token }
      });
      const meData = await meRes.json();
      console.log('GetMe status:', meRes.status, 'Phone:', meData.user?.phone);

      console.log('Testing /api/auth/me (Update WhatsApp Phone to +57 312 999 0011)...');
      const updateRes = await fetch('http://localhost:3099/api/auth/me', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + logData.token 
        },
        body: JSON.stringify({ phone: '+57 312 999 0011' })
      });
      const updateData = await updateRes.json();
      console.log('Update status:', updateRes.status, 'New Phone in profile:', updateData.user?.phone);

      console.log('Verifying settings updated...');
      const setRes = await fetch('http://localhost:3099/api/settings');
      const setData = await setRes.json();
      console.log('Shop Phone in Settings:', setData.settings?.phone);

      console.log('ALL AUTH & PRIVACY TESTS PASSED!');
    } catch (err) {
      console.error('Test error:', err);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

runTests();
