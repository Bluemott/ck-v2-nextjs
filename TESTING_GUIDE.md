# Testing Guide - Post-Deployment Verification

## Prerequisites

Before testing, ensure:

1. ✅ Code changes committed and pushed to GitHub
2. ✅ Amplify build completed successfully
3. ✅ No build errors in Amplify console

---

## Test 1: Amplify Build Verification

### Check Build Status

1. Go to AWS Amplify Console
2. Navigate to your app
3. Check latest build status

### Expected Results:

- ✅ Build status: **Succeeded**
- ✅ No errors mentioning `required-server-files.json`
- ✅ Build time: ~3-5 minutes
- ✅ Output includes `.next` directory

### If Build Fails:

```bash
# Check build logs in Amplify console
# Look for specific error messages
# Common issues:
# - npm install failures
# - TypeScript errors
# - Missing dependencies
```

---

## Test 2: Customize Page Images

### Test Steps:

1. Navigate to: `https://cowboykimono.com/custom-kimonos`
2. Open browser DevTools (F12)
3. Go to Network tab
4. Refresh page
5. Filter by "Img"

### Expected Results:

✅ **All images should load with status 200:**

```
GET /images/CK_Logo_Title_Deck_OUT.png - 200 OK
GET /images/Catherine's_Jacket_custom_page.webp - 200 OK
GET /images/Diane's_Jacket_custom_page.webp - 200 OK
GET /images/Doreen's MomJacket_custom_page.webp - 200 OK
GET /images/E_McD_Sleeve_custom_page.webp - 200 OK
GET /images/Mosaic_Athena_custom_page.webp - 200 OK
GET /images/Marisa_Young_Hat.webp - 200 OK
```

### Visual Verification:

- ✅ Hero logo displays at top
- ✅ Gallery carousel shows 5 jacket images
- ✅ Carousel animation works
- ✅ Marisa's photo displays in bottom section
- ✅ All images are sharp and properly optimized

### If Images Fail (404 errors):

```bash
# Check if images exist in repository
ls public/images/*.webp
ls public/images/*.png

# Verify build includes public folder
# Check Amplify build artifacts
```

---

## Test 3: Downloads API - Basic Functionality

### Test API Endpoint:

```bash
# Test all downloads
curl https://cowboykimono.com/api/downloads

# Test category filtering
curl https://cowboykimono.com/api/downloads?category=coloring-pages
curl https://cowboykimono.com/api/downloads?category=craft-templates
curl https://cowboykimono.com/api/downloads?category=diy-tutorials
```

### Expected Response Structure:

```json
{
  "downloads": [
    {
      "id": "coloring-pages",
      "title": "Coloring Pages",
      "description": "Free printable coloring pages...",
      "image": "/images/Neon_Coloring_Mock.webp",
      "thumbnails": [
        {
          "id": "download-123",
          "title": "ABQ Neon Coloring Page",
          "thumbnail": "https://api.cowboykimono.com/wp-content/uploads/...",
          "downloadUrl": "https://api.cowboykimono.com/wp-content/uploads/...",
          "description": "...",
          "type": "pdf"
        }
      ]
    }
  ],
  "pagination": {
    "totalPosts": 15,
    "totalPages": 1,
    "currentPage": 1,
    "perPage": 100,
    "hasNextPage": false,
    "hasPreviousPage": false
  },
  "meta": {
    "total": 15,
    "category": "all",
    "timestamp": "2025-10-09T...",
    "source": "wordpress"
  }
}
```

### Expected Behavior:

- ✅ Response status: `200 OK`
- ✅ Response time: < 2 seconds (first request)
- ✅ Response time: < 500ms (cached requests)
- ✅ `meta.source` = `"wordpress"`
- ✅ Categories sorted: coloring-pages, craft-templates, diy-tutorials
- ✅ Items within categories sorted alphabetically

### If API Fails:

#### Scenario 1: API returns empty downloads

```json
{
  "downloads": [],
  "pagination": {...},
  "meta": {"total": 0}
}
```

**Solution**: WordPress doesn't have any published downloads yet. Create downloads in WordPress admin.

#### Scenario 2: API returns 500 error

```json
{
  "error": "Failed to fetch downloads",
  "message": "..."
}
```

**Solution**: Check WordPress REST API:

```bash
# Test WordPress endpoint directly
curl https://api.cowboykimono.com/wp-json/wp/v2/downloads
```

If WordPress endpoint fails:

1. Verify custom post type is registered
2. Check `wordpress-downloads-setup.php` is added to functions.php
3. Verify `show_in_rest` is true

---

## Test 4: Downloads Page - Frontend

### Test Steps:

1. Navigate to: `https://cowboykimono.com/downloads`
2. Verify page loads
3. Check Network tab for API calls

### Expected Results:

#### Initial Load:

- ✅ Page displays 3 category cards:
  - Coloring Pages
  - Craft Templates
  - DIY Tutorials
- ✅ Each card shows thumbnail image
- ✅ Hover effect works on cards

#### Click Category:

1. Click "Coloring Pages" card
2. Card expands below
3. Shows thumbnails of available downloads

Expected behavior:

- ✅ Loading spinner appears briefly
- ✅ API call made: `/api/downloads?category=coloring-pages`
- ✅ Thumbnails load from WordPress
- ✅ Download buttons appear
- ✅ No local file paths (no `/downloads/...` in URLs)
- ✅ All URLs point to WordPress: `https://api.cowboykimono.com/wp-content/...`

#### Click Download Button:

- ✅ PDF downloads or blog post opens
- ✅ No 404 errors
- ✅ File is correct type (PDF, blog post, etc.)

### If Downloads Page Fails:

#### No thumbnails appear:

- Check WordPress ACF fields are set correctly
- Verify `download_thumbnail` field contains image ID
- Check API response includes thumbnail URLs

#### Download buttons say "Coming Soon":

- `downloadUrl` is empty or "#"
- Check WordPress ACF `download_file` or `download_url` fields

#### Error message appears:

- "Failed to load downloads"
- Check browser console for API errors
- Verify WordPress API is accessible

---

## Test 5: Caching & Performance

### Test Cache Headers:

```bash
# Check cache headers
curl -I https://cowboykimono.com/api/downloads

# Expected headers:
# Cache-Control: public, max-age=600
# X-Cache: MISS (first request)
# X-Cache: HIT (subsequent requests within 10 minutes)
```

### Test Image Optimization:

```bash
# Check image headers
curl -I https://cowboykimono.com/images/Catherine's_Jacket_custom_page.webp

# Expected headers:
# Cache-Control: public, max-age=31536000, immutable
# Content-Type: image/webp
```

### Performance Targets:

- ✅ Downloads API first load: < 2 seconds
- ✅ Downloads API cached: < 500ms
- ✅ Images load time: < 1 second each
- ✅ Total page load: < 3 seconds (customize page)
- ✅ Total page load: < 4 seconds (downloads page with API call)

---

## Test 6: Mobile Responsiveness

### Test on Mobile Device or DevTools:

1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select mobile device (iPhone 12, etc.)

### Test Pages:

- `/custom-kimonos`
- `/downloads`

### Expected Results:

- ✅ Images scale properly
- ✅ Gallery carousel scrolls on mobile
- ✅ Download cards stack vertically
- ✅ Buttons are touch-friendly (min 44px)
- ✅ Text is readable (no tiny fonts)

---

## Test 7: Error Handling

### Test API Error Handling:

```bash
# Test invalid category
curl https://cowboykimono.com/api/downloads?category=invalid-category

# Should return empty array, not error
```

### Test WordPress Down:

1. Temporarily make WordPress inaccessible
2. Try loading downloads page
3. Should show error message, not crash

Expected error UI:

- ⚠️ "Using fallback content. WordPress integration not available."
- ✅ Page doesn't crash
- ✅ User can still navigate site

---

## Rollback Procedure (If Tests Fail)

If critical issues found:

```bash
# 1. Revert code changes
git revert HEAD
git push origin master

# 2. Wait for Amplify rebuild
# 3. Verify site returns to previous working state

# 4. Debug issues locally before redeploying
npm run dev
# Test at http://localhost:3000
```

---

## Success Criteria

### ✅ All Tests Pass:

- [ ] Amplify build succeeds
- [ ] All customize page images load (7 images)
- [ ] Downloads API responds correctly
- [ ] WordPress data appears on downloads page
- [ ] No local file fallbacks used
- [ ] Caching works correctly
- [ ] Performance targets met
- [ ] Mobile responsive
- [ ] Error handling graceful

### 📊 Monitoring (First 24 Hours):

- Check CloudWatch logs for errors
- Monitor Amplify build stability
- Watch for 404 errors in logs
- Verify cache hit ratio improves

---

## WordPress Setup Verification

If downloads page is empty, verify WordPress configuration:

```bash
# 1. Test WordPress REST API
curl https://api.cowboykimono.com/wp-json/wp/v2/downloads

# 2. If 404, custom post type not registered
# Add wordpress-downloads-setup.php to functions.php

# 3. If returns empty array, no downloads published
# Create downloads in WordPress admin

# 4. If downloads missing ACF fields
# Install ACF Pro and configure field group
```

---

## Need Help?

### Common Issues:

1. **Build fails**: Check Amplify logs for specific error
2. **Images 404**: Verify files in `public/images/`
3. **API returns empty**: WordPress not configured
4. **Slow performance**: Check CloudWatch for Lambda errors
5. **CORS errors**: Check API Gateway settings

### Debugging Commands:

```bash
# Check build locally
npm run build

# Test API locally
npm run dev
curl http://localhost:3000/api/downloads

# Check for TypeScript errors
npm run type-check
```

---

## Post-Testing Actions

Once all tests pass:

1. ✅ Delete local downloads folder:

   ```bash
   rm -rf public/downloads/
   git add public/downloads/
   git commit -m "Remove local downloads - using WordPress API only"
   git push origin master
   ```

2. ✅ Update documentation
3. ✅ Monitor performance for 24 hours
4. ✅ Mark project as stable

---

## Test Results Template

Use this template to record test results:

```markdown
## Test Results - [Date]

### Build Status

- Amplify Build: ✅ / ❌
- Build Time: \_\_\_ minutes
- Errors: None / [describe]

### Customize Page

- Logo: ✅ / ❌
- Gallery Images (5): ✅ / ❌
- Marisa Photo: ✅ / ❌
- Load Time: \_\_\_ seconds

### Downloads API

- Endpoint Response: ✅ / ❌
- Category Filter: ✅ / ❌
- Response Time: \_\_\_ ms
- Total Downloads: \_\_\_

### Downloads Page

- Cards Display: ✅ / ❌
- Thumbnails Load: ✅ / ❌
- Download Buttons: ✅ / ❌
- WordPress URLs: ✅ / ❌

### Performance

- API First Load: \_\_\_ ms
- API Cached: \_\_\_ ms
- Image Load: \_\_\_ ms
- Cache Hit Ratio: \_\_\_%

### Issues Found

1. [Issue description]
2. [Issue description]

### Resolution Required

- [ ] [Action item]
- [ ] [Action item]
```
