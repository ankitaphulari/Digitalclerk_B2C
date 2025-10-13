# DigitalClerk - Chrome Extension

## Quick Setup

1. **Download Extension Files**: All extension files are in the `chrome-extension/` folder
2. **Load in Chrome**: Go to `chrome://extensions/` → Enable Developer mode → Click "Load unpacked" → Select the `chrome-extension` folder
3. **Get Extension ID**: Copy the extension ID from Chrome extensions page
4. **Update Web App**: Replace `'your-extension-id-here'` in `src/services/ExtensionService.ts` with your actual extension ID

## Features

- **Auto Form Detection**: Automatically finds and classifies form fields on any website
- **Intelligent Filling**: Fills forms using extracted document data with 80%+ accuracy
- **Smart Re-scanning**: Extracts missing data from original documents when needed
- **Visual Feedback**: Green highlights for filled fields, red for missing data
- **Real-time Communication**: Seamless integration with your web app

## Usage

1. Upload and process documents in your web app
2. Visit any website with forms
3. Extension automatically detects and fills forms
4. Manual filling available via extension popup

Extension transforms your document extraction web app into a complete automated form-filling solution across the entire web.