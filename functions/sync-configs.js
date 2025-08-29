#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Ensure directories exist
const constantsDir = path.join(__dirname, 'src', 'constants');
const cacheDir = path.join(__dirname, 'src', 'cache');

if (!fs.existsSync(constantsDir)) {
  fs.mkdirSync(constantsDir, { recursive: true });
}

if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

// Copy config files
const configFiles = [
  {
    source: path.join(__dirname, '..', 'constants', 'ReferralConfig.ts'),
    dest: path.join(constantsDir, 'ReferralConfig.ts')
  },
  {
    source: path.join(__dirname, '..', 'services', 'cache', 'referralCache.ts'),
    dest: path.join(cacheDir, 'referralCache.ts')
  }
];

configFiles.forEach(({ source, dest }) => {
  if (fs.existsSync(source)) {
    fs.copyFileSync(source, dest);
    console.log(`✓ Synced ${path.relative(__dirname, source)} → ${path.relative(__dirname, dest)}`);
  } else {
    console.error(`✗ Source file not found: ${source}`);
    process.exit(1);
  }
});

console.log('✅ Config files synced successfully');