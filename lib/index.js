const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Find all doctype folders with ts/ subdirectories
 * @param {string} baseDir - Base directory to search (usually process.cwd())
 * @param {string} doctypePattern - Pattern for doctype folder (default: 'MODULE_NAME/doctype')
 * @returns {Array} Array of doctype configurations
 */
function findDoctypesWithTS(baseDir, doctypePattern = '**/doctype') {
  const doctypes = [];
  const doctypeDirs = [];
  
  // Try to find doctype folders matching the pattern
  // For Frappe apps, usually: app_name/doctype/
  const possiblePaths = [
    path.join(baseDir, 'doctype'),
    ...fs.readdirSync(baseDir)
      .filter(f => fs.statSync(path.join(baseDir, f)).isDirectory())
      .map(f => path.join(baseDir, f, 'doctype'))
      .filter(p => fs.existsSync(p))
  ];
  
  for (const doctypeDir of possiblePaths) {
    if (!fs.existsSync(doctypeDir)) continue;
    
    const folders = fs.readdirSync(doctypeDir);
    
    for (const folder of folders) {
      const tsPath = path.join(doctypeDir, folder, 'ts');
      
      if (!fs.existsSync(tsPath)) continue;
      
      // Find all .ts files (not .d.ts)
      const tsFiles = fs.readdirSync(tsPath)
        .filter(f => f.endsWith('.ts') && !f.endsWith('.d.ts'));
      
      if (tsFiles.length > 0) {
        doctypes.push({
          name: folder,
          tsPath: tsPath,
          tsFiles: tsFiles,
          output: path.relative(baseDir, path.join(doctypeDir, folder, `${folder}.js`))
        });
      }
    }
  }
  
  return doctypes;
}

/**
 * Build a single doctype
 * @param {Object} doctype - Doctype configuration
 * @param {boolean} watch - Enable watch mode
 * @param {Object} options - Build options
 */
function buildDoctype(doctype, watch = false, options = {}) {
  const {
    external = ['frappe', 'jquery'],
    format = 'iife',
    banner = '// Copyright (c) 2025, AnyGridTech and contributors\n// For license information, please see license.txt'
  } = options;
  
  // Create a temporary entry file that imports all .ts files
  const tempEntry = path.join(doctype.tsPath, '__bundle_entry__.ts');
  const imports = doctype.tsFiles
    .map(f => `import "./${f.replace('.ts', '')}";`)
    .join('\n');
  
  fs.writeFileSync(tempEntry, imports);
  
  const externalArgs = external.map(e => `--external:${e}`).join(' ');
  
  const cmd = [
    'npx esbuild',
    path.relative(process.cwd(), tempEntry),
    '--bundle',
    `--outfile=${doctype.output}`,
    `--format=${format}`,
    externalArgs,
    `--banner:js="${banner}"`,
    watch ? '--watch' : ''
  ].filter(Boolean).join(' ');
  
  console.log(`Building ${doctype.name} (${doctype.tsFiles.length} file(s))...`);
  
  try {
    if (watch) {
      const proc = spawn(cmd, { shell: true, stdio: 'inherit' });
      proc.on('exit', () => {
        if (fs.existsSync(tempEntry)) fs.unlinkSync(tempEntry);
      });
      return proc;
    } else {
      execSync(cmd, { stdio: 'inherit' });
      if (fs.existsSync(tempEntry)) fs.unlinkSync(tempEntry);
    }
  } catch (error) {
    if (fs.existsSync(tempEntry)) fs.unlinkSync(tempEntry);
    throw error;
  }
}

/**
 * Start TypeScript type-checker
 * @param {string} baseDir - Base directory
 * @param {boolean} watch - Enable watch mode
 * @param {string} tsconfigPath - Path to tsconfig.json
 */
function startTypeChecker(baseDir, watch = false, tsconfigPath = 'tsconfig.base.json') {
  const configPath = path.join(baseDir, tsconfigPath);
  
  if (!fs.existsSync(configPath)) {
    console.warn(`⚠️  ${tsconfigPath} not found, skipping type-checking`);
    return null;
  }
  
  console.log('Starting TypeScript type-checker...');
  
  const args = ['tsc', '--noEmit', '-p', configPath];
  if (watch) args.push('--watch');
  
  const proc = spawn('npx', args, {
    stdio: 'inherit',
    shell: true
  });
  
  return proc;
}

/**
 * Clean up temporary bundle entry files
 * @param {Array} doctypes - Array of doctype configurations
 */
function cleanup(doctypes) {
  console.log('Cleaning up...');
  doctypes.forEach(dt => {
    const tempEntry = path.join(dt.tsPath, '__bundle_entry__.ts');
    if (fs.existsSync(tempEntry)) {
      fs.unlinkSync(tempEntry);
    }
  });
}

module.exports = {
  findDoctypesWithTS,
  buildDoctype,
  startTypeChecker,
  cleanup
};