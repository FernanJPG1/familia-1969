const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('C:\\Users\\Usuario\\Desktop\\Barberia\\index.html', 'utf8');

// Extract script 2
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scripts = [];
while ((match = scriptRegex.exec(html)) !== null) {
  if (match[1] && match[1].trim().length > 0) {
    scripts.push(match[1]);
  }
}

console.log('Found', scripts.length, 'scripts');
const script2 = scripts[1]; // The main app script

// Create a DOM mock sandbox
const mockElement = () => ({
  style: {},
  classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} },
  addEventListener: () => {},
  value: '',
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
      getItem: (k) => null,
      setItem: (k, v) => {},
      removeItem: (k) => {}
    }
  },
  document: {
    getElementById: (id) => mockElement(),
    querySelector: () => mockElement(),
    querySelectorAll: () => [],
    addEventListener: () => {},
    body: mockElement()
  },
  localStorage: {
    getItem: (k) => null,
    setItem: (k, v) => {},
    removeItem: (k) => {}
  },
  navigator: {
    serviceWorker: { register: () => Promise.resolve() }
  },
  fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
  setTimeout: (fn) => {},
  setInterval: (fn) => {},
  alert: console.log,
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

try {
  vm.runInNewContext(script2, sandbox);
  console.log('✅ Script 2 executed cleanly in top-level without throwing!');
  console.log('Sandbox currentAuthToken:', sandbox.currentAuthToken);
} catch (err) {
  console.error('❌ SCRIPT 2 THREW AT TOP-LEVEL:', err);
}
