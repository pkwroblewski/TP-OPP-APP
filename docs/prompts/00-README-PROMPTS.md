# TP Opportunity Finder - Implementation Prompts

## Overview
This folder contains 4 prompts to complete the implementation of the 3-layer anti-hallucination architecture for the TP Opportunity Finder app.

## Prompt Files

### 1. `update-main-extractor.md`
**Purpose:** Updates the main PDF extractor to use the new 3-layer architecture  
**When to use:** After the 3-layer system has been tested and verified  
**Expected outcome:** `pdfExtractor.ts` now calls `extractLuxembourgFinancials`

### 2. `update-frontend-validation-display.md`
**Purpose:** Adds validation warnings and TP opportunity flags to the UI  
**When to use:** After updating the main extractor  
**Expected outcome:** Frontend shows warnings, TP flags, and quality badges

### 3. `test-live-upload.md`
**Purpose:** Tests the complete end-to-end flow with PDF upload  
**When to use:** After frontend updates are complete  
**Expected outcome:** Verification that the entire system works correctly

### 4. `update-documentation.md`
**Purpose:** Updates project documentation (README, .claude-rules, technical docs)  
**When to use:** After successful testing  
**Expected outcome:** All documentation reflects the new architecture

## How to Use These Prompts

### Step 1: Open VS Code
1. Launch Visual Studio Code
2. Open your TP Opportunity Finder project folder
3. Start Claude Code (AI coding assistant)

### Step 2: Use Each Prompt in Order
For each prompt file:

1. **Open the prompt file** in a text editor (Notepad, VS Code, etc.)
2. **Copy the entire contents** (Ctrl+A, Ctrl+C)
3. **Paste into Claude Code chat** (Ctrl+V)
4. **Press Enter** to send
5. **Wait for Claude Code** to complete the task
6. **Verify the changes** before moving to the next prompt

### Step 3: Execution Order

```
1. update-main-extractor.md
   ↓
   Verify: No TypeScript errors
   ↓
2. update-frontend-validation-display.md
   ↓
   Verify: UI components created
   ↓
3. test-live-upload.md
   ↓
   Verify: Upload works, no hallucinations
   ↓
4. update-documentation.md
   ↓
   Complete!
```

## Expected Results

After running all 4 prompts successfully:

### ✅ Backend
- `pdfExtractor.ts` uses 3-layer architecture
- All IC transactions extracted with sources
- EUR 91.3M Item 4 flagged as "unverified"
- TP opportunities auto-detected

### ✅ Frontend
- Warnings section displays validation issues
- TP opportunities section shows flagged items
- Extraction quality badge shows confidence level
- Results table has verification status badges

### ✅ Testing
- APERAM B155908 extraction verified
- No hallucinated values
- All amounts have sources
- 121.8% implied rate flagged

### ✅ Documentation
- README.md has extraction architecture section
- .claude-rules updated with verified status
- Technical documentation created

## Troubleshooting

### If Claude Code says "I can't find the file"
- The file may not exist yet (this is okay for new files)
- Check the file path in the prompt
- Verify you're in the correct project directory

### If TypeScript errors appear
- Run `npm install` to ensure all dependencies are installed
- Check that all imports are correct
- Verify the function signatures match

### If the test fails
- Check the console for error messages
- Verify the PDF file exists at `docs/B155908.pdf`
- Review the extraction output in `test-results/aperam-extraction.json`

## Success Criteria

You'll know the implementation is successful when:

1. ✅ No TypeScript compilation errors
2. ✅ `npm run dev` starts without errors
3. ✅ PDF upload extracts all IC transactions
4. ✅ Item 4 shows warning badge (not claimed as IC)
5. ✅ All values have source references
6. ✅ TP opportunities displayed with priority flags
7. ✅ Extraction quality shows "HIGH" confidence

## Support

If you encounter issues:

1. **Check the error message** in Claude Code's response
2. **Review the validation results** in test output
3. **Verify file paths** match your project structure
4. **Ensure dependencies installed**: `npm install`
5. **Ask Claude Code for help** with specific error messages

## File Naming Convention for Future Prompts

```
[action]-[component]-[purpose].md
```

**Examples:**
- `update-main-extractor.md` - Updating existing code
- `create-new-feature.md` - Building new functionality
- `test-extraction.md` - Testing specific feature
- `fix-bug.md` - Fixing issues
- `deploy-production.md` - Deployment tasks

**Action Prefixes:**
- `update-` = Modify existing code
- `create-` = Build new feature
- `test-` = Verification/testing
- `fix-` = Bug fixes
- `add-` = Add new capability
- `deploy-` = Deployment
- `document-` = Documentation

## Next Steps After Implementation

Once all 4 prompts are complete:

1. **Test with multiple PDFs** to ensure robustness
2. **Deploy to production** environment
3. **Monitor extraction quality** metrics
4. **Collect user feedback** on TP opportunities
5. **Iterate and improve** based on real usage

---

**Created:** December 2024  
**Version:** 1.0  
**Architecture:** 3-Layer Anti-Hallucination System  
**Status:** Ready for implementation
