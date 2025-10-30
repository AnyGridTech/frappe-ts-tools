const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Recursively find all .ts files in a directory
 * @param {string} dir - Directory to search
 * @param {string} baseDir - Base directory for relative paths
 * @returns {Array} Array of relative file paths
 */
function findTSFilesRecursively(dir, baseDir = dir) {
  let results = [];
  
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Recursively search subdirectories
        results = results.concat(findTSFilesRecursively(filePath, baseDir));
      } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
        // Add relative path from baseDir
        results.push(path.relative(baseDir, filePath));
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return results;
}

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
      
      // Find all .ts files recursively (not .d.ts)
      const tsFiles = findTSFilesRecursively(tsPath);
      
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
function startTypeChecker(baseDir, watch = false, tsconfigPath = 'tsconfig.json') {
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

/**
 * Find all public/ts folders in the app
 * @param {string} baseDir - Base directory to search (usually process.cwd())
 * @returns {Array} Array of public folder configurations
 */
function findPublicTSFolders(baseDir) {
  const publicFolders = [];
  
  // Look for public/ts folders in the app structure
  const possiblePaths = [
    path.join(baseDir, 'public', 'ts'),
    ...fs.readdirSync(baseDir)
      .filter(f => {
        try {
          return fs.statSync(path.join(baseDir, f)).isDirectory();
        } catch {
          return false;
        }
      })
      .map(f => path.join(baseDir, f, 'public', 'ts'))
      .filter(p => fs.existsSync(p))
  ];
  
  for (const tsPath of possiblePaths) {
    if (!fs.existsSync(tsPath)) continue;
    
    // Find all .ts files recursively (not .d.ts)
    const tsFiles = findTSFilesRecursively(tsPath);
    
    if (tsFiles.length > 0) {
      const publicDir = path.dirname(tsPath);
      const jsPath = path.join(publicDir, 'js');
      
      // Ensure js output directory exists
      if (!fs.existsSync(jsPath)) {
        fs.mkdirSync(jsPath, { recursive: true });
      }
      
      publicFolders.push({
        tsPath: tsPath,
        jsPath: jsPath,
        tsFiles: tsFiles,
        baseDir: baseDir
      });
    }
  }
  
  return publicFolders;
}

/**
 * Build public TypeScript files (no bundling, one-to-one compilation)
 * @param {Object} publicFolder - Public folder configuration
 * @param {boolean} watch - Enable watch mode
 * @param {Object} options - Build options
 */
function buildPublicTS(publicFolder, watch = false, options = {}) {
  const {
    format = 'esm',
    target = 'es2020',
    banner = '// Copyright (c) 2025, AnyGridTech and contributors\n// For license information, please see license.txt'
  } = options;
  
  // Build each TypeScript file individually (no bundling, no external)
  const commands = publicFolder.tsFiles.map(tsFile => {
    const inputFile = path.join(publicFolder.tsPath, tsFile);
    const outputFile = path.join(publicFolder.jsPath, tsFile.replace('.ts', '.js'));
    
    // Ensure output subdirectory exists
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const relativeInput = path.relative(process.cwd(), inputFile);
    const relativeOutput = path.relative(process.cwd(), outputFile);
    
    return {
      tsFile,
      cmd: [
        'npx esbuild',
        relativeInput,
        `--outfile=${relativeOutput}`,
        `--format=${format}`,
        `--target=${target}`,
        `--banner:js="${banner}"`,
        watch ? '--watch' : ''
      ].filter(Boolean).join(' ')
    };
  });
  
  console.log(`Building ${publicFolder.tsFiles.length} public TypeScript file(s)...`);
  
  const processes = [];
  
  for (const { tsFile, cmd } of commands) {
    console.log(`  - ${tsFile}`);
    
    try {
      if (watch) {
        const proc = spawn(cmd, { shell: true, stdio: 'inherit' });
        processes.push(proc);
      } else {
        execSync(cmd, { stdio: 'inherit' });
      }
    } catch (error) {
      console.error(`Failed to build ${tsFile}:`, error.message);
      throw error;
    }
  }
  
  return processes;
}

module.exports = {
  findDoctypesWithTS,
  buildDoctype,
  startTypeChecker,
  cleanup,
  findPublicTSFolders,
  buildPublicTS
};