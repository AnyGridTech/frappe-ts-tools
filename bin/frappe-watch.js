#!/usr/bin/env node
const { findDoctypesWithTS, buildDoctype, startTypeChecker, cleanup, findPublicTSFolders, buildPublicTS } = require('../lib');

const baseDir = process.cwd();
const withTypeCheck = process.argv.includes('--typecheck');
const doctypes = findDoctypesWithTS(baseDir);
const publicFolders = findPublicTSFolders(baseDir);

if (doctypes.length === 0 && publicFolders.length === 0) {
  console.log('No DocTypes with ts/ folders or public/ts folders found');
  process.exit(0);
}

// Display DocTypes
if (doctypes.length > 0) {
  console.log(`Found ${doctypes.length} DocType(s) with TypeScript:`);
  doctypes.forEach(dt => console.log(`  - ${dt.name} (${dt.tsFiles.length} file(s))`));
  console.log('');
}

// Display public folders
if (publicFolders.length > 0) {
  console.log(`Found ${publicFolders.length} public/ts folder(s):`);
  publicFolders.forEach(pf => console.log(`  - ${pf.tsFiles.length} file(s) in ${pf.tsPath}`));
  console.log('');
}

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

// Start watching each public folder
publicFolders.forEach(pf => {
  const procs = buildPublicTS(pf, true);
  if (procs) watchProcs.push(...procs);
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