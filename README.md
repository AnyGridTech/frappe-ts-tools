# @anygridtech/frappe-ts-tools

Build tools for Frappe DocTypes with TypeScript support.

## Features

- 🚀 Fast bundling with esbuild
- 👀 Watch mode for development
- 🔍 TypeScript type-checking
- 📦 Auto-discovers DocTypes with TypeScript
- 📁 Compiles public TypeScript files (individual or bundled)
- 🎯 Optional bundling mode for public folder
- ⚡ Zero configuration needed

## Installation

```bash
npm install --save-dev @anygridtech/frappe-ts-tools typescript
```

## Configuration

You need a `tsconfig.json` file in your module's root directory (or in the directory with the `public/` folder). Here's a recommended configuration:

```json
{
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "./js",
    "module": "preserve",
    "target": "ESNext",
    "esModuleInterop": false,
    "importHelpers": false,
    "noEmitHelpers": true,
    "verbatimModuleSyntax": false,
    "types": [
      "jquery",
      "@anygridtech/frappe-agt-types",
      "@anygridtech/frappe-types"
    ],
    "sourceMap": false,
    "allowSyntheticDefaultImports": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true,
    "removeComments": true,
    "strict": true,
    "isolatedModules": true,
    "noUncheckedSideEffectImports": true,
    "moduleDetection": "force"
  },
  "include": ["ts/**/*.ts", "**/ts/**/*.ts"],
  "exclude": ["node_modules", "**/__bundle_entry__.ts"],
  "watchOptions": {
    "watchFile": "fixedPollingInterval",
    "watchDirectory": "fixedPollingInterval",
    "fallbackPolling": "dynamicPriority"
  }
}
```

**Note:** Adjust the `types` array according to your installed type packages.

## Usage

### Build all DocTypes

```bash
# Default: individual file compilation for public/ folder
npx frappe-build

# Bundle mode: single bundle file for public/ folder
npx frappe-build --bundle

# Bundle with custom name (creates public/js/myapp.bundle.js)
npx frappe-build --bundle --bundle-name=myapp
```

### Watch mode (auto-rebuild on changes)

```bash
# Default: individual file compilation
npx frappe-watch

# Bundle mode: single bundle file
npx frappe-watch --bundle

# Bundle with custom name
npx frappe-watch --bundle --bundle-name=myapp
```

### Watch mode with type-checking

```bash
# With individual files
npx frappe-watch --typecheck

# With bundling
npx frappe-watch --bundle --typecheck
```

### Type-check only

```bash
npx frappe-typecheck
```

### Type-check in watch mode

```bash
npx frappe-typecheck --watch
```

## Project Structure

Your Frappe app should have this structure:

```
your_app/
├── your_module/
│   └── doctype/
│       └── your_doctype/
│           ├── your_doctype.json
│           ├── your_doctype.py
│           ├── your_doctype.js  (output)
│           └── ts/              (source)
│               ├── onload.ts
│               ├── refresh.ts
│               └── ...
├── public/                      (optional)
│   ├── ts/                      (source)
│   │   ├── utils.ts
│   │   ├── api.ts
│   │   └── ...
│   └── js/                      (output)
│       ├── utils.js
│       ├── api.js
│       └── ...
├── tsconfig.json
└── package.json
```

### DocType TypeScript (Bundled)

Place TypeScript files in `ts/` folder next to your DocType. All `.ts` files will be bundled into a single `<doctype_name>.js` file.

### Public TypeScript (Individual Files or Bundled)

Place TypeScript files in `public/ts/` folder. You have two compilation modes:

#### Individual Mode (Default)
Each `.ts` file compiles to a corresponding `.js` file in `public/js/` folder **without bundling**. This is perfect for:
- Utility libraries
- Shared modules
- API clients
- Independent scripts

Example: `public/ts/utils.ts` → `public/js/utils.js`

#### Bundle Mode (Optional)
All `.ts` files are bundled into a single `{bundleName}.bundle.js` file in `public/js/` folder. This is ideal for:
- Single application bundle
- Reduced HTTP requests
- Better code optimization
- Simplified dependency management

Example: All files → `public/js/app.bundle.js`

Use `--bundle` flag to enable bundle mode, and `--bundle-name=xyz` to customize the output filename.

## Optional: Add to package.json

For convenience, you can add scripts to your `package.json`:

```json
{
  "scripts": {
    "build": "frappe-build",
    "build:bundle": "frappe-build --bundle",
    "watch": "frappe-watch",
    "watch:bundle": "frappe-watch --bundle",
    "typecheck": "frappe-typecheck"
  }
}
```

Then run: `npm run watch` or `npm run watch:bundle`

## How it works

### DocType Compilation (Bundled)
1. Scans your app for DocTypes with `ts/` folders
2. Creates a temporary bundle entry that imports all `.ts` files
3. Bundles with esbuild into `<doctype_name>.js`
4. Cleans up temporary files

### Public Folder Compilation (Individual or Bundled)
1. Scans your app for `public/ts/` folders
2. **Individual mode (default)**: Compiles each `.ts` file individually (no bundling), outputs to `public/js/` folder maintaining the same filename
3. **Bundle mode (`--bundle` flag)**: Bundles all `.ts` files into a single `{bundleName}.bundle.js` file in `public/js/` folder
4. Watch mode supports both compilation modes

Both modes run in parallel and support watch mode with optional TypeScript type-checking.

## Requirements

- Node.js >= 18
- TypeScript >= 5.0
- Frappe app structure

## License

MIT
