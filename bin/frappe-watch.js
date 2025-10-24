#!/usr/bin/env node
const { findDoctypesWithTS, buildDoctype, startTypeChecker, cleanup } = require('../lib');

const baseDir = process.cwd();
const withTypeCheck = process.argv.includes('--typecheck');
const doctypes = findDoctypesWithTS(baseDir);

if (doctypes.length === 0) {
  console.log('No DocTypes with ts/ folders found');
  process.exit(0);
}

console.log(`Found ${doctypes.length} DocType(s) with TypeScript:`);
doctypes.forEach(dt => console.log(`  - ${dt.name} (${dt.tsFiles.length} file(s))`));
console.log('');

// Start type-checker if requested
let typeCheckerProc;
if (withTypeCheck) {
  typeCheckerProc = startTypeChecker(baseDir, true);
  console.log('');
}

// Start watching each doctype
const watchProcs = [];
doctypes.forEach(dt => {
  const proc = buildDoctype(dt, true);
  if (proc) watchProcs.push(proc);
});

console.log('\n👀 Watching for changes... (Press Ctrl+C to stop)');

// Handle Ctrl+C cleanup
process.on('SIGINT', () => {
  cleanup(doctypes);
  
  if (typeCheckerProc) {
    typeCheckerProc.kill();
  }
  
  watchProcs.forEach(proc => {
    try {
      proc.kill();
    } catch (e) {
      // Ignore errors on kill
    }
  });
  
  console.log('\n👋 Stopped watching');
  process.exit(0);
});