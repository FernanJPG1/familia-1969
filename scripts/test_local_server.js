const http = require('http');

http.get('http://localhost:3000/index.html', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('HTTP Status:', res.statusCode);
    console.log('Contains id="landing-view":', data.includes('id="landing-view"'));
    console.log('Contains id="app-view":', data.includes('id="app-view"'));
    console.log('Contains scrollytelling:', data.includes('scrolly-section'));
    console.log('Contains openAuthModal:', data.includes('openAuthModal'));
    console.log('Length of response:', data.length);
  });
}).on('error', (err) => {
  console.error('Request error:', err.message);
});
