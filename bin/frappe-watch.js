#!/usr/bin/env node
const { findDoctypesWithTS, buildDoctype, startTypeChecker, cleanup, findPublicTSFolders, buildPublicTS, bundlePublicTS, cleanupPublicBundles } = require('../lib');

// Parse command line arguments
const args = process.argv.slice(2);
const withTypeCheck = args.includes('--typecheck');
const useBundle = args.includes('--bundle');
const bundleName = args.find(arg => arg.startsWith('--bundle-name='))?.split('=')[1] || 'app';

const baseDir = process.cwd();
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
  let proc;
  if (useBundle) {
    // Bundle mode: single file output
    proc = bundlePublicTS(pf, true, { bundleName });
  } else {
    // Default mode: individual file outputs
    proc = buildPublicTS(pf, true);
  }
  if (proc) watchProcs.push(proc);
});

console.log('\n👀 Watching for changes... (Press Ctrl+C to stop)');

// Handle Ctrl+C cleanup
process.on('SIGINT', () => {
  cleanup(doctypes);
  cleanupPublicBundles(publicFolders);
  
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