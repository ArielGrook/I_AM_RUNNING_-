#!/usr/bin/env node
// Usage: node generate-ecosystem.js CLIENT_DIR PM2_NAME IAM_DIR
// Reads CLIENT_DIR/.env and writes CLIENT_DIR/ecosystem.config.js

const fs = require('fs');
const path = require('path');

const clientDir = process.argv[2];
const pm2Name  = process.argv[3];
const iamDir   = process.argv[4];

if (!clientDir || !pm2Name || !iamDir) {
  console.error('Usage: node generate-ecosystem.js CLIENT_DIR PM2_NAME IAM_DIR');
  process.exit(1);
}

const envFile = path.join(clientDir, '.env');
const env = {};

fs.readFileSync(envFile, 'utf8').split('\n').forEach(line => {
  line = line.trim();
  if (!line || line.startsWith('#')) return;
  const idx = line.indexOf('=');
  if (idx < 0) return;
  const k = line.slice(0, idx).trim();
  const v = line.slice(idx + 1).trim();
  if (k) env[k] = v;
});

const config = {
  apps: [{
    name: pm2Name,
    script: 'npm',
    args: 'start',
    cwd: iamDir,
    env: env
  }]
};

const outFile = path.join(clientDir, 'ecosystem.config.js');
fs.writeFileSync(outFile, 'module.exports = ' + JSON.stringify(config, null, 2));
console.log('Written: ' + outFile);
