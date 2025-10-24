# @anygridtech/frappe-ts-tools

Build tools for Frappe DocTypes with TypeScript support.

## Features

- 🚀 Fast bundling with esbuild
- 👀 Watch mode for development
- 🔍 TypeScript type-checking
- 📦 Auto-discovers DocTypes with TypeScript
- ⚡ Zero configuration needed

## Installation

```bash
npm install --save-dev @anygridtech/frappe-ts-tools typescript
```

## Usage

### Build all DocTypes

```bash
npx frappe-build
```

### Watch mode (auto-rebuild on changes)

```bash
npx frappe-watch
```

### Watch mode with type-checking

```bash
npx frappe-watch --typecheck
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
├── tsconfig.base.json
└── package.json
```

## Optional: Add to package.json

For convenience, you can add scripts to your `package.json`:

```json
{
  "scripts": {
    "build": "frappe-build",
    "watch": "frappe-watch",
    "typecheck": "frappe-typecheck"
  }
}
```

Then run: `npm run watch`

## How it works

1. Scans your app for DocTypes with `ts/` folders
2. Creates a temporary bundle entry that imports all `.ts` files
3. Bundles with esbuild into `<doctype_name>.js`
4. Cleans up temporary files
5. Optionally runs TypeScript type-checker in parallel

## Requirements

- Node.js >= 18
- TypeScript >= 5.0
- Frappe app structure

## License

MIT