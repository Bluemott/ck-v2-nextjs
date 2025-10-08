# 🚀 Deployment Checklist for AWS Amplify

Use this checklist before every deployment to AWS Amplify.

## Pre-Deployment Checklist

### Local Verification

- [ ] Run `npm run type-check` - No TypeScript errors
- [ ] Run `npm run lint` - No ESLint errors
- [ ] Run `npm run build` - Build succeeds
- [ ] Run `npm run verify:amplify-deployment` - All checks pass
- [ ] Test locally with `npm start` - Site works correctly

### Content Verification

- [ ] All new images are in `public/images/` directory
- [ ] All new download PDFs are in `public/downloads/` directory
- [ ] File names match exactly in code (case-sensitive)
- [ ] No broken links or references

### Git Status

- [ ] All changes committed: `git status` shows clean
- [ ] Commit message is descriptive
- [ ] Reviewed changes: `git diff HEAD~1 HEAD`
- [ ] Ready to push: No uncommitted work

## AWS Amplify Console Configuration

### Environment Variables (Set Once)

- [ ] `NODE_ENV=production`
- [ ] `NEXT_PUBLIC_WORDPRESS_REST_URL=https://api.cowboykimono.com`
- [ ] `NEXT_PUBLIC_APP_URL=https://cowboykimono.com`
- [ ] `NEXT_PUBLIC_SITE_URL=https://cowboykimono.com`
- [ ] `NEXT_TELEMETRY_DISABLED=1`

### Build Settings (Set Once)

- [ ] Node version: 18.x or higher
- [ ] Build image: Large (7 GB) if memory issues
- [ ] Build timeout: 30 minutes
- [ ] amplify.yml is detected and used

## Deployment Process

### Step 1: Push to Repository

```bash
git push origin master
```

### Step 2: Monitor Build

- [ ] AWS Amplify Console shows build started
- [ ] Watch Provision phase (1-2 min)
- [ ] Watch Pre-build phase (5-7 min)
- [ ] Watch Build phase (3-5 min)
- [ ] Watch Deploy phase (2-3 min)

### Step 3: Build Success Checks

- [ ] Build completed without errors
- [ ] All phases show green checkmarks
- [ ] Build artifacts generated successfully
- [ ] Deployment succeeded

## Post-Deployment Verification

### Immediate Checks (Wait 2-3 min for CloudFront propagation)

- [ ] Homepage loads: https://cowboykimono.com
- [ ] Custom Kimonos page: https://cowboykimono.com/custom-kimonos
  - [ ] All 7 images load correctly
  - [ ] Gallery carousel works
- [ ] Downloads page: https://cowboykimono.com/downloads
  - [ ] All PDF downloads work
  - [ ] Thumbnails display correctly
- [ ] Blog page: https://cowboykimono.com/blog
- [ ] Shop page: https://cowboykimono.com/shop

### Browser Testing

- [ ] Clear browser cache (Ctrl+Shift+Del)
- [ ] Test in Chrome
- [ ] Test in Firefox or Safari
- [ ] Check mobile responsiveness
- [ ] No console errors (F12 → Console)

### Performance Checks

- [ ] Page load time < 3 seconds
- [ ] Images load quickly
- [ ] No broken links
- [ ] Downloads work correctly

## Troubleshooting

### If Build Fails

1. Check build logs in Amplify Console
2. Reference `AMPLIFY_QUICK_FIX.md` for common issues
3. Reference `AMPLIFY_DEPLOYMENT_GUIDE.md` for detailed solutions

### If Deployment Succeeds But Site Broken

1. Clear CloudFront cache (Amplify Console → Redeploy with cache cleared)
2. Wait 5 minutes for full propagation
3. Check browser console for specific errors
4. Verify environment variables in Amplify Console

### Emergency Rollback

If site is completely broken:

1. Go to Amplify Console → Deployments
2. Find last working build
3. Click "Redeploy this version"

## Success Criteria

Deployment is successful when:

- ✅ Build completed without errors
- ✅ All pages load correctly
- ✅ All images display
- ✅ All downloads work
- ✅ No console errors
- ✅ Performance is good (< 3s load time)
- ✅ Mobile site works correctly

## Quick Commands Reference

```bash
# Verify everything before push
npm run verify:amplify-deployment

# Local testing
npm run build
npm start

# Check what will be deployed
git status
git log --oneline -5

# Push to deploy
git push origin master

# After deployment, test
curl -I https://cowboykimono.com
curl -I https://cowboykimono.com/downloads
curl -I https://cowboykimono.com/custom-kimonos
```

## Documentation Reference

- **Quick fixes:** `AMPLIFY_QUICK_FIX.md`
- **Detailed guide:** `AMPLIFY_DEPLOYMENT_GUIDE.md`
- **Architecture:** `DOCUMENTATION.md`
- **Cursor rules:** `.cursorrules`

---

**Last Updated:** October 8, 2025
**Version:** 1.0.0
