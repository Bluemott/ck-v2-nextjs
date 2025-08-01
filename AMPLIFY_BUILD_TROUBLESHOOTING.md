# 🔧 Amplify Build Troubleshooting Guide

## Current Issue: YAML Malformed Commands Error

The error you're seeing indicates that Amplify is having trouble parsing the buildspec YAML due to unescaped reserved YAML characters.

### ✅ Fixed Issues

1. **Simplified amplify.yml**: Removed emojis and complex echo statements
2. **Properly quoted environment variables**: All exports now use double quotes
3. **Removed problematic characters**: No more colons or special characters in echo statements

### 🔍 Next Steps to Diagnose

#### 1. Check Amplify Console Environment Variables

Go to your Amplify Console and check these environment variables for problematic characters:

**Common problematic characters:**
- `:` (colons)
- `|` (pipes)
- `>` (greater than)
- `[` `]` (brackets)
- `{` `}` (braces)
- `&` `*` `#` `?` `-` `!` `%` `@` `` ` `` (backticks)

**Environment variables to check:**
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_WPGRAPHQL_URL`
- `NEXT_PUBLIC_USE_REST_API`
- `NODE_ENV`
- Any custom environment variables

#### 2. Test the Build Locally

```bash
# Test the build process locally
npm run build
```

#### 3. Check for Hidden Files

Look for any hidden buildspec files:
```bash
# Check for buildspec files
find . -name "buildspec*" -type f
```

#### 4. Verify amplify.yml Syntax

The current amplify.yml has been simplified and should work. Key changes:
- Removed emojis from echo statements
- Properly quoted all environment variables
- Simplified command structure

### 🚀 Deployment Strategy

#### For Development Testing:

1. **Use the simplified amplify.yml** (already updated)
2. **Test on a development branch first**
3. **Monitor the build logs carefully**

#### For Production:

1. **Create a staging environment** in Amplify
2. **Test the build process** on staging first
3. **Only deploy to production** after successful staging builds

### 🔧 Manual Environment Variable Fix

If you find problematic environment variables in Amplify Console:

1. **Go to Amplify Console** → Your App → Environment Variables
2. **Check each variable** for special characters
3. **Wrap values in quotes** if needed
4. **Use base64 encoding** for complex values
5. **Consider using AWS Systems Manager Parameter Store** for sensitive values

### 📋 Environment Variable Best Practices

```bash
# ✅ Good
NEXT_PUBLIC_SITE_URL="https://cowboykimono.com"
NEXT_PUBLIC_USE_REST_API="true"

# ❌ Bad
NEXT_PUBLIC_SITE_URL=https://cowboykimono.com
NEXT_PUBLIC_USE_REST_API=true
```

### 🆘 If the Issue Persists

1. **Check Amplify Console logs** for more specific error messages
2. **Try the fallback amplify.yml** (amplify-fallback.yml)
3. **Contact AWS Support** if the issue continues
4. **Consider using AWS CodeBuild** as an alternative

### 📞 Support Resources

- [AWS Amplify Build Settings Documentation](https://docs.aws.amazon.com/amplify/latest/userguide/build-settings.html)
- [YAML Syntax Guide](https://yaml.org/spec/1.2/spec.html)
- [AWS Amplify Console](https://console.aws.amazon.com/amplify)

### 🔄 Rollback Plan

If needed, you can quickly rollback to a working configuration:

1. **Use amplify-production-ready.yml** as a backup
2. **Revert to a previous commit** that was working
3. **Use the fallback configuration** (amplify-fallback.yml) 