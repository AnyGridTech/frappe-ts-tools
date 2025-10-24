#!/usr/bin/env node
// filepath: /workspace/development/frappe-bench/apps/frappe-build-tools/bin/frappe-typecheck.js
const { startTypeChecker } = require('../lib');

const baseDir = process.cwd();
const watch = process.argv.includes('--watch');

const proc = startTypeChecker(baseDir, watch);

if (!proc) {
  console.error('❌ Failed to start type-checker');
  process.exit(1);
}

if (watch) {
  console.log('\n👀 Watching for type errors... (Press Ctrl+C to stop)');
  
  process.on('SIGINT', () => {
    proc.kill();
    console.log('\n👋 Stopped type-checking');
    process.exit(0);
  });
}