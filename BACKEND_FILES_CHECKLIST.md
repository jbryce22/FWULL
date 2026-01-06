# Backend Files Upload Checklist

Upload these files to **Wix Editor → Backend** folder:

## Required Backend Files (Copy contents from repo):

- [ ] `backend/airtable.jsw` (15KB)
- [ ] `backend/logger.jsw` (3KB) ⚠️ **MISSING - This is causing your error**
- [ ] `backend/validation.jsw` (10KB)
- [ ] `backend/retryUtils.jsw` (8KB)
- [ ] `backend/sessionManager.jsw` (7KB)
- [ ] `backend/errorHandler.jsw` (10KB)
- [ ] `backend/transactionManager.jsw` (12KB)
- [ ] `backend/airtableRefactored.jsw` (15KB)

## How to Upload:

1. Open Wix Editor
2. Left sidebar → **Backend & Public Code** icon
3. Click **+** to add new file
4. Name it exactly as shown above (e.g., `logger.jsw`)
5. Copy/paste the contents from the corresponding file in this repo
6. Repeat for all 8 files
7. **Publish** the site

## Verify Upload Worked:

In browser console (F12), type:
```javascript
import { loggers } from 'backend/logger.jsw';
console.log(loggers.registration);
```

Should show: `Logger { category: 'REGISTRATION' }`

If you see `undefined`, the file didn't upload correctly.
