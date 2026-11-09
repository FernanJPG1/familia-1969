const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('C:\\Users\\Usuario\\Desktop\\Barberia\\index.html', 'utf8');

const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scripts = [];
while ((match = scriptRegex.exec(html)) !== null) {
  if (match[1] && match[1].trim().length > 0) {
    scripts.push(match[1]);
  }
}

const script2 = scripts[1];

const mockElement = () => ({
  style: {},
  classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} },
  addEventListener: () => {},
  value: 'test',
  disabled: false,
  innerHTML: '',
  textContent: '',
  appendChild: () => {},
  setAttribute: () => {},
  getAttribute: () => null,
  querySelector: () => null,
  querySelectorAll: () => []
});

const sandbox = {
  window: {
    location: { search: '', href: '' },
    scrollTo: () => {},
    addEventListener: () => {},
    localStorage: {
      storage: {},
      getItem(k) { return this.storage[k] || null; },
      setItem(k, v) { this.storage[k] = v; },
      removeItem(k) { delete this.storage[k]; }
    }
  },
  document: {
    getElementById: (id) => {
      const el = mockElement();
      if (id === 'login-email') el.value = 'admin@familia1969.com';
      if (id === 'login-password') el.value = 'FamiliaAdmin1969*';
      return el;
    },
    querySelector: () => mockElement(),
    querySelectorAll: () => [],
    addEventListener: () => {},
    body: mockElement()
  },
  localStorage: {
    storage: {},
    getItem(k) { return this.storage[k] || null; },
    setItem(k, v) { this.storage[k] = v; },
    removeItem(k) { delete this.storage[k]; }
  },
  navigator: {
    userAgent: 'Mozilla/5.0 Chrome',
    serviceWorker: { register: () => Promise.resolve() }
  },
  fetch: (url, opts) => {
    if (url === '/api/auth/login') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          token: 'jwt-mock-test-token-12345',
          user: { id: 'usr-admin', email: 'admin@familia1969.com', role: 'admin', name: 'Admin Master' }
        })
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ bookings: [], barbers: [], settings: {} })
    });
  },
  setTimeout: (fn, ms) => fn(),
  setInterval: (fn, ms) => {},
  alert: (msg) => console.log('ALERT CALLED:', msg),
  console: console,
  URLSearchParams: class {
    get() { return null; }
  },
  IntersectionObserver: class {
    observe() {}
  }
};
sandbox.window.window = sandbox.window;
sandbox.window.document = sandbox.document;

vm.runInNewContext(script2, sandbox);

console.log('Testing handleBarberLogin execution...');
const fakeEvent = { preventDefault: () => {} };

sandbox.handleBarberLogin(fakeEvent).then(() => {
  console.log('✅ handleBarberLogin executed successfully!');
  console.log('Token after login:', sandbox.currentAuthToken);
  console.log('User after login:', sandbox.currentAuthUser);
  if (sandbox.currentAuthToken === 'jwt-mock-test-token-12345') {
    console.log('🎉 PERFECT LOGIN VERIFICATION!');
    process.exit(0);
  } else {
    console.error('❌ Token not set!');
    process.exit(1);
  }
}).catch(err => {
  console.error('❌ handleBarberLogin failed:', err);
  process.exit(1);
});
