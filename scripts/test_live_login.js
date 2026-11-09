const https = require('https');

function testLiveLogin(email, password) {
  const data = JSON.stringify({ email, password });
  const start = Date.now();

  const req = https.request('https://familia-1969.vercel.app/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      const elapsed = Date.now() - start;
      console.log(`\n=== LOGIN EN PRODUCCIÓN: ${email} ===`);
      console.log(`Status        : ${res.statusCode}`);
      console.log(`Tiempo Latencia: ${elapsed}ms`);
      try {
        const json = JSON.parse(body);
        console.log(`Rol Usuario   : ${json.user?.role}`);
        console.log(`Nombre Usuario: ${json.user?.name}`);
        console.log(`Token Generado: ${Boolean(json.token)}`);
      } catch {
        console.log('Body:', body);
      }
    });
  });

  req.on('error', err => console.error('Error:', err.message));
  req.write(data);
  req.end();
}

testLiveLogin('admin@familia1969.com', 'FamiliaAdmin1969*');
testLiveLogin('barbero@familia1969.com', 'Familia1969*');
