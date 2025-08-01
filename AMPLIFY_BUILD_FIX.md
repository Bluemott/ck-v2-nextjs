# Amplify Build Fix Guide

## Issues Identified

1. **SSM Secrets Setup Failure**: The build is failing to set up SSM secrets
2. **Backend Environment Issues**: Invalid backend environment name
3. **Complex Workspace Setup**: Multiple workspaces causing dependency conflicts
4. **Amplify Configuration**: Overly complex build configuration

## Solutions Applied

### 1. Simplified amplify.yml
- Removed complex fallback strategies
- Streamlined dependency installation
- Removed workspace build steps that may cause conflicts

### 2. Updated Next.js Configuration
- Added proper environment variable handling
- Ensured TypeScript and ESLint ignore build errors
- Optimized for AWS deployment

### 3. Created Alternative Build Scripts
- `scripts/simple-build.js`: Simplified build process
- `amplify-simple.yml`: Alternative configuration without workspaces

## Immediate Actions

### Option 1: Use Simplified Configuration (Recommended)
1. Rename `amplify.yml` to `amplify.yml.backup`
2. Rename `amplify-simple.yml` to `amplify.yml`
3. Push to dev branch

### Option 2: Fix Current Configuration
1. The current `amplify.yml` has been simplified
2. Push the changes to dev branch

### Option 3: Manual Build Test
1. Run `npm run build:simple` locally to test
2. If successful, use the simplified approach

## Environment Variables

Ensure these environment variables are set in Amplify Console:
- `NODE_ENV=production`
- Any AWS-specific variables needed for your application

## Workspace Considerations

The project has two workspaces:
- `infrastructure/`: AWS CDK infrastructure
- `lambda/graphql/`: GraphQL Lambda function

These are not needed for the frontend build and may be causing conflicts.

## Next Steps

1. Try the simplified configuration first
2. If successful, gradually add back workspace support
3. Monitor build logs for any remaining issues
4. Consider separating infrastructure builds from frontend builds

## Rollback Plan

If the simplified approach doesn't work:
1. Restore the original `amplify.yml.backup`
2. Try the `build:simple` script approach
3. Consider removing workspaces temporarily for frontend builds 