# Script Content Display Fix

## Issue
Script sections were showing headers and timestamps but no content was displaying when expanded.

## Root Cause
The section parsing logic was including the timestamp line `[HOOK - 0:00-0:16]` in the content, then the rendering logic was filtering out any lines matching the timestamp pattern. This resulted in empty sections.

## Fix Applied

### 1. **Parsing Fix** (line 738)
**Before:**
```typescript
currentContent = [line]  // Included timestamp line
```

**After:**
```typescript
currentContent = []  // Don't include the timestamp line
```

### 2. **Rendering Simplification** (lines 1767-1799)
**Before:**
- Split content by `'\n\n'` (double newlines)
- Filter out paragraphs matching timestamp regex
- Complex paragraph handling

**After:**
- Split content by `'\n'` (single newlines)
- Skip only empty lines
- Simpler line-by-line rendering
- Added fallback message for empty sections

### 3. **Debug Logging Added**
```typescript
console.log('[Script Sections] Parsing script, length:', generatedScript.length)
console.log('[Script Sections] Parsed sections:', sections)
```

## How It Works Now

1. **Parsing Stage:**
   - When a timestamp line is detected: `[SECTION_NAME - 0:00-1:00]`
   - Section metadata is extracted (title, timestamps)
   - Content collection starts AFTER the timestamp line
   - Next lines are added to currentContent[]
   - When next timestamp found, previous section is saved

2. **Rendering Stage:**
   - Each section's content is split by line breaks
   - Lines are rendered as paragraphs
   - Stage directions `[like this]` get special styling
   - Empty lines are skipped
   - Fallback message shown if section has no content

## Testing
To verify the fix works:

1. Generate a script with timestamps
2. Sections should show content when expanded
3. Check browser console for debug logs
4. Verify content displays correctly in both:
   - Formatted view (with sections)
   - Raw view (plain text)

## Example Script Format That Works

```
[HOOK - 0:00-0:16]
Have you ever wondered why the sky is blue? Today we're diving deep into the science behind this everyday phenomenon.

[INTRODUCTION - 0:16-0:45]
Before we get into the details, let me tell you a quick story. [pause for effect] When I was a kid, I asked my teacher this question...

[MAIN CONTENT - 0:45-2:00]
The answer lies in something called Rayleigh scattering. Light from the sun enters our atmosphere...
```

## Files Modified
- `/frontend/src/pages/ScriptGeneratorPage.tsx`

## Status
✅ Fixed and tested
✅ Build successful
✅ Debug logging added for troubleshooting

---
**Fixed on:** 2026-01-25
**Issue:** Script sections showing empty content
**Solution:** Exclude timestamp lines from section content during parsing
