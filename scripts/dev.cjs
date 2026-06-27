#!/usr/bin/env node

const { spawn } = require('node:child_process');
const path = require('node:path');

const [targetFile] = process.argv.slice(2);

if (!targetFile) {
  console.error('Usage: pnpm dev <file.md>');
  process.exit(1);
}

const electronViteBin = require.resolve('electron-vite/bin/electron-vite.js');
const child = spawn(process.execPath, [electronViteBin, 'dev'], {
  env: {
    ...process.env,
    MDVIEW_FILE: path.resolve(process.cwd(), targetFile),
  },
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
