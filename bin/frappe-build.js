#!/usr/bin/env node
const { findDoctypesWithTS, buildDoctype, findPublicTSFolders, buildPublicTS, bundlePublicTS } = require('../lib');

// Parse command line arguments
const args = process.argv.slice(2);
const useBundle = args.includes('--bundle');
const bundleName = args.find(arg => arg.startsWith('--bundle-name='))?.split('=')[1] || 'app';

const baseDir = process.cwd();
const doctypes = findDoctypesWithTS(baseDir);
const publicFolders = findPublicTSFolders(baseDir);

if (doctypes.length === 0 && publicFolders.length === 0) {
  console.log('No DocTypes with ts/ folders or public/ts folders found');
  process.exit(0);
}

// Build DocTypes
if (doctypes.length > 0) {
  console.log(`Found ${doctypes.length} DocType(s) with TypeScript:`);
  doctypes.forEach(dt => console.log(`  - ${dt.name} (${dt.tsFiles.length} file(s))`));
  console.log('');

  try {
    doctypes.forEach(dt => buildDoctype(dt, false));
    console.log('✅ DocTypes built successfully\n');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Build public TypeScript files
if (publicFolders.length > 0) {
  console.log(`Found ${publicFolders.length} public/ts folder(s):`);
  publicFolders.forEach(pf => console.log(`  - ${pf.tsFiles.length} file(s) in ${pf.tsPath}`));
  console.log('');

  try {
    if (useBundle) {
      // Bundle all public TS files into a single file
      publicFolders.forEach(pf => bundlePublicTS(pf, false, { bundleName }));
      console.log('✅ Public TypeScript files bundled successfully\n');
    } else {
      // Build each file individually (default behavior)
      publicFolders.forEach(pf => buildPublicTS(pf, false));
      console.log('✅ Public TypeScript files built successfully\n');
    }
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}