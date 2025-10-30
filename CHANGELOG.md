# Changelog

## [Unreleased] - 2025-10-30

### Fixed
- **Recursive TypeScript file discovery**: Now the tool correctly finds and compiles TypeScript files in subfolders within:
  - `doctype/*/ts/` directories (and all subdirectories)
  - `public/ts/` directories (and all subdirectories)
  
### Changed
- Added `findTSFilesRecursively()` helper function to recursively search for `.ts` files
- Updated `findDoctypesWithTS()` to use recursive search
- Updated `findPublicTSFolders()` to use recursive search
- Updated `buildPublicTS()` to create output subdirectories automatically

### Technical Details

**Before:**
- Only compiled `.ts` files directly in `public/ts/` (flat structure)
- Only compiled `.ts` files directly in `doctype/*/ts/` (flat structure)

**After:**
- Recursively finds all `.ts` files in subdirectories
- Maintains directory structure in output (e.g., `public/ts/utils/helper.ts` → `public/js/utils/helper.js`)
- Automatically creates necessary output subdirectories

**Example structure now supported:**
```
public/
  ts/
    main.ts              ✅ (already worked)
    utils/
      helper.ts          ✅ (now works!)
      validators.ts      ✅ (now works!)
    components/
      dialog.ts          ✅ (now works!)

doctype/
  my_doctype/
    ts/
      index.ts           ✅ (already worked)
      controllers/
        list.ts          ✅ (now works!)
        form.ts          ✅ (now works!)
```
