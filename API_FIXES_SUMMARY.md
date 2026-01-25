# API and AI Service Fixes - Complete Summary

## Issues Fixed

### 1. Foreign Key Constraint Violations
**Problem**: All creator tool endpoints were saving `persona_id` directly from requests, even when the persona didn't exist in the database.

**Fix**: Updated all endpoints to only save `persona_id` if the persona was actually found:
```python
persona_id_to_save = request.persona_id if persona else None
```

**Affected Files**:
- `backend/app/api/v1/endpoints/creator_tools.py` (lines 128, 169, 210, 250)
  - `/generate-titles`
  - `/generate-thumbnail-ideas`
  - `/generate-social-caption`
  - `/optimize-seo`

### 2. Frontend-Backend Parameter Mismatches

#### Title Generator
- **Frontend was sending**: `topic`
- **Backend expects**: `video_topic`
- **Fixed**: `frontend/src/pages/TitleGeneratorPage.tsx:44`
- **Response parsing**: Changed from `data.titles` to `data.meta_data?.titles`

#### Social Caption Generator
- **Frontend was sending**: `content`
- **Backend expects**: `content_description`
- **Fixed**: `frontend/src/pages/SocialCaptionPage.tsx:44`
- **Endpoint**: Changed from `/social-caption` to `/generate-social-caption`
- **Response parsing**: Changed to `data.content_text`

#### SEO Optimizer
- **Endpoint**: Changed from `/seo-optimize` to `/optimize-seo`
- **Fixed**: `frontend/src/pages/SEOOptimizerPage.tsx:58`
- **Response parsing**: Fixed to use `data.meta_title`, `data.meta_description`, `data.suggested_keywords`
- **Added validation**: Target keywords are now required (frontend validates before sending)

### 3. Error Handling
**Problem**: FastAPI validation errors were showing "[object Object]" in UI

**Fix**: Added proper error parsing for all endpoints:
```typescript
if (Array.isArray(errorData.detail)) {
  const errorMsg = errorData.detail.map((err: any) => err.msg).join(', ')
  throw new Error(errorMsg || 'Failed to ...')
}
```

**Affected Files**:
- `frontend/src/pages/TitleGeneratorPage.tsx:64-68`
- `frontend/src/pages/SocialCaptionPage.tsx:56-60`
- `frontend/src/pages/SEOOptimizerPage.tsx:63-67`

### 4. Mock Personas Removed
**Problem**: PersonaContext was using hardcoded personas with IDs '1' and '2' that don't exist in database

**Fix**: Removed mock data, starts with empty array (should load from API)
- `frontend/src/contexts/PersonaContext.tsx:36`

### 5. Vertex AI Configuration
**Problem**: Vertex AI credentials not loading properly

**Fixes**:
1. **Environment Variables** (`.env`):
   - Changed `GOOGLE_CLOUD_PROJECT` → `GOOGLE_VERTEX_PROJECT_ID`
   - Changed `GOOGLE_CLOUD_LOCATION` → `GOOGLE_VERTEX_LOCATION`
   - Made `GOOGLE_APPLICATION_CREDENTIALS` absolute path

2. **Config** (`backend/app/core/config.py:31`):
   - Added `GOOGLE_APPLICATION_CREDENTIALS` setting

3. **AI Service** (`backend/app/services/ai_service.py`):
   - Explicitly load credentials from JSON file
   - Use `vertexai.init()` instead of `aiplatform.init()`
   - Added `import os` and `from google.oauth2 import service_account`
   - Model: `gemini-2.5-pro` (user's choice)
   - Import: `from vertexai.preview.generative_models import GenerativeModel`

## API Endpoint Summary

### All Working Endpoints:
1. **POST** `/api/v1/creator-tools/generate-script`
   - Expects: `topic`, `duration_minutes`, `tone`, `target_audience`, `persona_id` (optional), `ai_model`
   - Returns: ContentResponse with `content_text` containing script

2. **POST** `/api/v1/creator-tools/generate-titles`
   - Expects: `video_topic`, `keywords` (optional), `count`, `persona_id` (optional), `ai_model`
   - Returns: ContentResponse with `meta_data.titles` array

3. **POST** `/api/v1/creator-tools/generate-thumbnail-ideas`
   - Expects: `video_title`, `video_topic`, `persona_id` (optional), `ai_model`
   - Returns: ContentResponse with `meta_data.ideas` array

4. **POST** `/api/v1/creator-tools/generate-social-caption`
   - Expects: `content_description`, `platform`, `include_hashtags`, `include_emojis`, `persona_id` (optional), `ai_model`
   - Returns: ContentResponse with `content_text` containing caption

5. **POST** `/api/v1/creator-tools/optimize-seo`
   - Expects: `content`, `target_keywords` (required array), `persona_id` (optional), `ai_model`
   - Returns: Object with `meta_title`, `meta_description`, `suggested_keywords`, `optimized_content`, `seo_score`

## AI Model Configuration

**Default**: All frontend pages now use `ai_model: 'vertex'`

**Available Models**:
- `vertex` - Google Vertex AI (gemini-2.5-pro)
- `openai` - OpenAI GPT-4
- `groq` - Groq (mixtral-8x7b)

## Testing Checklist

- [ ] Script Generator - works with all parameters
- [ ] Title Generator - generates titles with keywords
- [ ] Thumbnail Ideas - returns JSON with ideas
- [ ] Social Captions - platform-specific captions
- [ ] SEO Optimizer - requires keywords, returns meta tags
- [ ] All endpoints handle missing persona gracefully
- [ ] Error messages are readable (not "[object Object]")
- [ ] Vertex AI authenticates successfully

## Next Steps

1. **Create real personas** via the Personas page or API
2. **Verify Vertex AI** is initialized successfully in backend logs
3. **Test each tool** end-to-end with both persona and no persona
4. **Monitor logs** for any remaining errors
