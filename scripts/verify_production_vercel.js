const https = require('https');

function fetchUrl(targetUrl) {
  console.log(`Testing URL: ${targetUrl}`);
  const start = Date.now();

  https.get(targetUrl, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      console.log(`Redirecting (${res.statusCode}) to: ${res.headers.location}`);
      const redirectUrl = new URL(res.headers.location, targetUrl).href;
      fetchUrl(redirectUrl);
      return;
    }

    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      const elapsed = Date.now() - start;
      console.log(`\n=== RESULTADO PRODUCCIÓN VERCEL ===`);
      console.log(`URL Final        : ${targetUrl}`);
      console.log(`Status Code      : ${res.statusCode}`);
      console.log(`Tiempo Respuesta : ${elapsed}ms`);
      console.log(`Tamaño HTML      : ${body.length} bytes`);
      console.log(`Landing View     : ${body.includes('id="landing-view"') ? 'PRESENTE [OK]' : 'FALTA'}`);
      console.log(`App View         : ${body.includes('id="app-view"') ? 'PRESENTE [OK]' : 'FALTA'}`);
      console.log(`Scrollytelling   : ${body.includes('scrolly-section') ? 'PRESENTE [OK]' : 'FALTA'}`);
      console.log(`Login CTA        : ${body.includes("openAuthModal('login')") ? 'PRESENTE [OK]' : 'FALTA'}`);
      console.log(`Register CTA     : ${body.includes("openAuthModal('register')") ? 'PRESENTE [OK]' : 'FALTA'}`);
      console.log(`Entrar al Sistema: ${body.includes("showAppView()") ? 'PRESENTE [OK]' : 'FALTA'}`);
      console.log(`Rituales VIP     : ${body.includes('Ritual Barba Imperial') ? 'PRESENTE [OK]' : 'FALTA'}`);
      console.log(`===================================`);
    });
  }).on('error', (err) => {
    console.error('Error:', err.message);
  });
}

fetchUrl('https://familia-1969.vercel.app/');
