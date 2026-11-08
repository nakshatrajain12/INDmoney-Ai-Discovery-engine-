// Bridge to run TypeScript phase2-live-check.ts via tsx
const { spawnSync } = require('child_process');
const path = require('path');

const target = path.join(__dirname, 'phase2-live-check.ts');
const isWin = process.platform === 'win32';
const npx = isWin ? 'npx.cmd' : 'npx';
const res = spawnSync(npx, ['tsx', target], { encoding: 'utf8', env: process.env });
if (res.stdout) process.stdout.write(res.stdout);
if (res.stderr) process.stderr.write(res.stderr);
process.exit(res.status ?? 0);
