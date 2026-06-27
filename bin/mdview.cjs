#!/usr/bin/env node

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const printUsage = () => {
  console.error('Usage: mdview <file.md>');
};

const [targetFile] = process.argv.slice(2);

if (!targetFile) {
  printUsage();
  process.exit(1);
}

const appRoot = path.resolve(__dirname, '..');
const mainEntry = path.join(appRoot, 'out/main/index.js');
const electronExecutable = process.env.ELECTRON_BIN || require('electron');
const resolvedTargetFile = path.resolve(process.cwd(), targetFile);

if (!fs.existsSync(mainEntry)) {
  console.error('mdview has not been built yet. Run `pnpm build` first.');
  process.exit(1);
}

const child = spawn(electronExecutable, [appRoot], {
  env: {
    ...process.env,
    MDVIEW_FILE: resolvedTargetFile,
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
