# Amplify Build Troubleshooting Guide

## Common Issues and Solutions

### 1. Windows File Permission Issues

**Problem**: On Windows, Tailwind CSS binary files can get locked by the system or antivirus software, causing EPERM errors.

**Solution**: 
- Run the cleanup script: `npm run cleanup:windows`
- Close any text editors or IDEs that might be using the files
- Temporarily disable antivirus software
- Run PowerShell as Administrator
- Use `npm install` instead of `npm ci` on Windows

### 2. Workspace Dependencies Issues

**Problem**: npm workspaces can cause dependency resolution issues in Amplify builds.

**Solution**: 
- Use `npm ci --workspaces --legacy-peer-deps --no-optional` for installation
- Build workspace packages separately with fallback handling
- Added `build:workspaces` script to package.json

### 3. Next.js Standalone Output Conflicts

**Problem**: `output: 'standalone'` in next.config.ts conflicts with Amplify's build process.

**Solution**: 
- Temporarily removed standalone output configuration
- Amplify handles deployment differently than standalone builds

### 4. TypeScript/ESLint Strict Mode

**Problem**: Strict TypeScript and ESLint configurations can cause build failures.

**Solution**:
- Temporarily set `ignoreBuildErrors: true` and `ignoreDuringBuilds: true`
- This allows the build to complete while you fix individual issues

### 5. Memory and Timeout Issues

**Problem**: Large builds can exceed Amplify's memory limits or timeout.

**Solution**:
- Optimize build process with proper caching
- Use incremental builds where possible
- Consider code splitting and lazy loading

## Build Process Steps

### PreBuild Phase
1. Clean npm cache to avoid file conflicts
2. Install dependencies with workspace support
3. Build workspace packages (infrastructure, lambda/graphql)
4. Handle any workspace build failures gracefully

### Build Phase
1. Run Next.js build with optimized configuration
2. Generate static assets for deployment

## Testing Locally

### Windows Users
First, run the cleanup script to resolve file permission issues:

```bash
npm run cleanup:windows
npm install --legacy-peer-deps
npm run test:build
```

### Non-Windows Users
Run the test script to verify your build process locally:

```bash
npm run test:build
```

This script will:
- Check Node.js and npm versions
- Install dependencies (with Windows-specific handling)
- Build workspace packages
- Build the Next.js app
- Report any issues

## Environment Variables

Ensure these environment variables are set in Amplify:

```
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_GTM_ID=your-gtm-id
NEXT_PUBLIC_GOOGLE_VERIFICATION=your-verification-code
```

## Performance Optimizations

1. **Caching**: Configure proper cache paths in amplify.yml
2. **Dependencies**: Use exact versions to avoid resolution issues
3. **Build Time**: Optimize imports and use code splitting
4. **Bundle Size**: Monitor and optimize bundle sizes

## Monitoring Build Logs

Key things to watch for in build logs:

1. **File Permission Errors**: EPERM errors on Windows systems
2. **Dependency Warnings**: Deprecated packages or peer dependency issues
3. **Memory Usage**: Large builds consuming too much memory
4. **Timeout Errors**: Builds taking too long
5. **TypeScript Errors**: Type checking failures
6. **ESLint Errors**: Code quality issues

## Windows-Specific Troubleshooting

If you're on Windows and experiencing file permission issues:

1. **Run cleanup script**: `npm run cleanup:windows`
2. **Close applications**: Close any text editors, IDEs, or file explorers
3. **Disable antivirus**: Temporarily disable antivirus software
4. **Run as Administrator**: Run PowerShell as Administrator
5. **Clear cache**: `npm cache clean --force`
6. **Use alternative install**: `npm install --force --legacy-peer-deps`

## Rollback Strategy

If builds continue to fail:

1. Revert to a known working configuration
2. Gradually re-enable strict TypeScript/ESLint
3. Fix issues one at a time
4. Test locally before pushing to Amplify

## Contact Support

If issues persist:
1. Check Amplify build logs for specific error messages
2. Test locally with `npm run test:build`
3. Review recent changes that might have caused issues
4. Consider temporary workarounds while fixing root causes 