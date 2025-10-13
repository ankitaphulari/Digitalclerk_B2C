# DigitalClerk Chrome Extension Installation Guide

## Installation Steps

1. **Download Extension Files**: All files are in the `chrome-extension/` folder
2. **Open Chrome Extensions**: Navigate to `chrome://extensions/`
3. **Enable Developer Mode**: Toggle "Developer mode" on (top right)
4. **Load Extension**: Click "Load unpacked" → Select the `chrome-extension` folder
5. **Copy Extension ID**: Note the extension ID from the extensions page
6. **Update Web App**: Replace placeholder in `src/services/ExtensionService.ts` with actual extension ID

## What's Fixed

✅ Cleaned manifest.json formatting
✅ Added all required icon files (16x16, 32x32, 48x48, 128x128)
✅ Fixed JSON syntax errors
✅ Verified all referenced files exist
✅ Consistent port configuration (8080)

Your extension should now load without the "Manifest file is missing or unreadable" error!