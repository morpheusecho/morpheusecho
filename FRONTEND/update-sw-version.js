const fs = require('fs');
const path = require('path');

// Path to your service worker file
const swPath = path.join(__dirname, 'public', 'sw.js');

// Read the current service worker file
let swContent = fs.readFileSync(swPath, 'utf8');

// Replace the cache name with a unique timestamp-based version
const newVersion = `morpheus-echo-v${Date.now()}`;
swContent = swContent.replace(/const CACHE_NAME\s*=\s*'[^']+';/, `const CACHE_NAME = '${newVersion}';`);

// Save the dynamically updated file
fs.writeFileSync(swPath, swContent);
console.log(`✅ Service Worker cache version automatically updated to: ${newVersion}`);