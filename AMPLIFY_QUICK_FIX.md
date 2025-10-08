# AWS Amplify Quick Fix Guide

## 🚨 Most Common Issues & Immediate Fixes

### 1. Build Failing? Check These First

```bash
# Locally verify everything works
npm run type-check && npm run lint && npm run build
```

**If local build works but Amplify fails:**

#### Fix A: Update Environment Variables in Amplify Console

1. Go to AWS Amplify Console → Your App → Environment variables
2. Add/Update these variables:

```
NODE_ENV=production
NEXT_PUBLIC_WORDPRESS_REST_URL=https://api.cowboykimono.com
NEXT_PUBLIC_APP_URL=https://cowboykimono.com
NEXT_TELEMETRY_DISABLED=1
```

3. Save and trigger new build

#### Fix B: Increase Memory (Heap Out of Memory Error)

1. Amplify Console → Build settings → Build image settings
2. Select "Large (7 GB)" compute
3. Updated `amplify.yml` already includes: `NODE_OPTIONS="--max-old-space-size=4096"`

#### Fix C: Clear Cache and Rebuild

1. Amplify Console → Your app → Latest deployment
2. Click "Redeploy this version"
3. Check "Clear cache" option
4. Click "Redeploy"

### 2. Images Not Showing After Deployment?

**Check file names match exactly (case-sensitive on Linux):**

```bash
# Verify files are committed to git
git ls-files public/images/ | grep -i custom

# Expected files for custom-kimonos page:
# - Catherine's_Jacket_custom_page.webp
# - Diane's_Jacket_custom_page.webp
# - Doreen's MomJacket_custom_page.webp
# - E_McD_Sleeve_custom_page.webp
# - Mosaic_Athena_custom_page.webp
# - CK_Logo_Title_Deck_OUT.png
# - Marisa_Young_Hat.webp
```

**If files missing from git:**

```bash
git add public/images/
git commit -m "Add missing images"
git push origin master
```

### 3. Downloads Page Not Working?

**Verify PDF files exist:**

```bash
# Check all PDFs are committed
git ls-files public/downloads/

# Should see:
# - coloring-pages/*.pdf
# - craft-templates/*.pdf
# - DIY-tutorials/*.pdf
```

**If missing:**

```bash
git add public/downloads/
git commit -m "Add download PDFs"
git push origin master
```

### 4. Build Timeout?

**Increase timeout in Amplify Console:**

1. App settings → Build settings
2. Build timeout: Set to 30 minutes
3. Save changes
4. Trigger new build

### 5. Old Version Still Showing?

**Clear CloudFront Cache:**

Option A (via Amplify):

1. Go to Amplify deployment
2. "Redeploy this version" with cache cleared

Option B (via CLI):

```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

## 📋 Quick Deployment Checklist

Before pushing to trigger Amplify build:

- [ ] `npm run type-check` passes locally
- [ ] `npm run lint` passes locally
- [ ] `npm run build` succeeds locally
- [ ] All new images/files are in `public/` directory
- [ ] All changes are committed to git
- [ ] `git status` shows "working tree clean"
- [ ] Environment variables are set in Amplify Console

## 🔍 Where to Look for Errors

1. **Amplify Console Build Logs:**
   - AWS Amplify Console → Your App → Build (the one that failed)
   - Expand each phase to see detailed output
   - Look for "ERROR", "FATAL", or "failed"

2. **Updated amplify.yml provides:**
   - Node/NPM versions
   - Disk space info
   - Environment variable values
   - File existence checks
   - Detailed step-by-step output

## 💡 Pro Tips

### Tip 1: Test Build Locally First

```bash
# This mimics what Amplify does
export NODE_ENV=production
rm -rf .next node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
```

### Tip 2: Check WordPress API During Build

The build fetches data from WordPress. Test connectivity:

```bash
curl -I https://api.cowboykimono.com/wp-json/wp/v2/posts?per_page=1
```

Should return `200 OK`

### Tip 3: Monitor Build in Real-Time

Keep Amplify Console open during deployment to catch errors immediately

## 🆘 Still Not Working?

1. **Try Manual Redeploy:**
   - In Amplify Console, find a working previous build
   - Click "Redeploy this version"
   - This confirms if the issue is with new code or Amplify config

2. **Check Build Logs for Specific Error:**
   - Look for the first ERROR message in logs
   - Google the specific error message
   - Reference AMPLIFY_DEPLOYMENT_GUIDE.md for detailed solutions

3. **Verify No Breaking Changes:**
   ```bash
   git diff HEAD~1 HEAD
   ```
   Review what changed since last working deployment

## 📞 Emergency Contact

- **Amplify Status:** https://status.aws.amazon.com/
- **Documentation:** See AMPLIFY_DEPLOYMENT_GUIDE.md
- **Architecture Details:** See DOCUMENTATION.md

---

**Remember:** The updated `amplify.yml` provides much better debugging output. Check those logs first!

**Last Updated:** October 8, 2025
