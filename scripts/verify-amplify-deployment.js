#!/usr/bin/env node

/**
 * AWS Amplify Deployment Verification Script
 *
 * This script verifies that all necessary files and configurations
 * are in place before pushing to AWS Amplify for deployment.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SUCCESS = '\x1b[32m✓\x1b[0m';
const ERROR = '\x1b[31m✗\x1b[0m';
const WARNING = '\x1b[33m⚠\x1b[0m';
const INFO = '\x1b[36mℹ\x1b[0m';

let hasErrors = false;
let hasWarnings = false;

console.log('\n🔍 AWS Amplify Deployment Verification\n');
console.log('='.repeat(60));

/**
 * Check if a file exists
 */
function checkFile(filePath, description) {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    console.log(`${SUCCESS} ${description}: ${filePath}`);
    return true;
  } else {
    console.log(`${ERROR} ${description} MISSING: ${filePath}`);
    hasErrors = true;
    return false;
  }
}

/**
 * Check if a directory exists and has files
 */
function checkDirectory(dirPath, description, pattern = null) {
  const fullPath = path.join(process.cwd(), dirPath);
  if (fs.existsSync(fullPath)) {
    const files = fs.readdirSync(fullPath);
    if (pattern) {
      const matchingFiles = files.filter((f) => f.match(pattern));
      if (matchingFiles.length > 0) {
        console.log(
          `${SUCCESS} ${description}: ${matchingFiles.length} files found`
        );
        return true;
      } else {
        console.log(`${ERROR} ${description}: No matching files found`);
        hasErrors = true;
        return false;
      }
    } else {
      if (files.length > 0) {
        console.log(`${SUCCESS} ${description}: ${files.length} items found`);
        return true;
      } else {
        console.log(`${WARNING} ${description}: Directory empty`);
        hasWarnings = true;
        return false;
      }
    }
  } else {
    console.log(`${ERROR} ${description} MISSING: ${dirPath}`);
    hasErrors = true;
    return false;
  }
}

/**
 * Run a command and check if it succeeds
 */
function checkCommand(command, description) {
  try {
    execSync(command, { stdio: 'pipe' });
    console.log(`${SUCCESS} ${description}`);
    return true;
  } catch (error) {
    console.log(`${ERROR} ${description} FAILED`);
    if (error.stdout) {
      console.log(`   Output: ${error.stdout.toString().substring(0, 200)}`);
    }
    hasErrors = true;
    return false;
  }
}

console.log('\n📦 Checking Required Files...\n');

// Check core configuration files
checkFile('amplify.yml', 'Amplify build configuration');
checkFile('package.json', 'Package configuration');
checkFile('next.config.ts', 'Next.js configuration');
checkFile('tsconfig.json', 'TypeScript configuration');

console.log('\n🖼️  Checking Custom Kimonos Page Images...\n');

// Check custom kimonos page images
const customKimonosImages = [
  "Catherine's_Jacket_custom_page.webp",
  "Diane's_Jacket_custom_page.webp",
  "Doreen's MomJacket_custom_page.webp",
  'E_McD_Sleeve_custom_page.webp',
  'Mosaic_Athena_custom_page.webp',
  'CK_Logo_Title_Deck_OUT.png',
  'Marisa_Young_Hat.webp',
];

customKimonosImages.forEach((img) => {
  checkFile(`public/images/${img}`, `Custom kimono image: ${img}`);
});

console.log('\n📥 Checking Downloads Directory...\n');

// Check downloads directories
checkDirectory(
  'public/downloads/coloring-pages',
  'Coloring pages PDFs',
  /\.pdf$/
);
checkDirectory(
  'public/downloads/craft-templates',
  'Craft templates PDFs',
  /\.pdf$/
);
checkDirectory(
  'public/downloads/DIY-tutorials',
  'DIY tutorials PDFs',
  /\.pdf$/
);

console.log('\n🔧 Checking Build Configuration...\n');

// Check if build works
checkCommand('npm run type-check', 'TypeScript type checking');
checkCommand('npm run lint', 'ESLint validation');

console.log('\n📝 Checking Git Status...\n');

// Check git status
try {
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf-8' });
  if (gitStatus.trim() === '') {
    console.log(`${SUCCESS} All changes committed to git`);
  } else {
    console.log(`${WARNING} Uncommitted changes found:`);
    console.log(gitStatus.split('\n').slice(0, 10).join('\n'));
    if (gitStatus.split('\n').length > 10) {
      console.log(`   ... and ${gitStatus.split('\n').length - 10} more`);
    }
    hasWarnings = true;
  }
} catch (error) {
  console.log(`${WARNING} Could not check git status`);
  hasWarnings = true;
}

console.log('\n🔍 Checking Environment Configuration...\n');

// Check .env.local.example exists
if (checkFile('.env.local.example', 'Environment variables example')) {
  console.log(
    `${INFO} Ensure these environment variables are set in Amplify Console:`
  );
  const envExample = fs.readFileSync('.env.local.example', 'utf-8');
  const requiredVars = envExample.match(/^[A-Z_]+=.*/gm) || [];
  requiredVars.slice(0, 8).forEach((v) => {
    const key = v.split('=')[0];
    console.log(`   - ${key}`);
  });
}

console.log('\n📊 Checking Package Dependencies...\n');

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const criticalDeps = ['next', 'react', 'react-dom', 'typescript'];

  criticalDeps.forEach((dep) => {
    if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
      const version =
        packageJson.dependencies[dep] || packageJson.devDependencies[dep];
      console.log(`${SUCCESS} ${dep}: ${version}`);
    } else {
      console.log(`${ERROR} Missing critical dependency: ${dep}`);
      hasErrors = true;
    }
  });
} catch (error) {
  console.log(`${ERROR} Could not read package.json`);
  hasErrors = true;
}

console.log('\n🎯 Checking Build Output...\n');

// Check if .next directory exists (from previous build)
if (fs.existsSync('.next')) {
  console.log(`${SUCCESS} Previous build artifacts found (.next directory)`);
  const requiredServerFiles = path.join('.next', 'required-server-files.json');
  if (fs.existsSync(requiredServerFiles)) {
    console.log(`${SUCCESS} Required server files present`);
  } else {
    console.log(
      `${WARNING} Required server files not found (run 'npm run build' locally to verify)`
    );
    hasWarnings = true;
  }
} else {
  console.log(
    `${INFO} No previous build found. Run 'npm run build' to test locally.`
  );
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📋 Summary\n');

if (hasErrors) {
  console.log(
    `${ERROR} Verification FAILED - Please fix the errors above before deploying\n`
  );
  process.exit(1);
} else if (hasWarnings) {
  console.log(`${WARNING} Verification completed with WARNINGS\n`);
  console.log(
    'You can proceed with deployment, but consider addressing the warnings.\n'
  );
  process.exit(0);
} else {
  console.log(
    `${SUCCESS} All checks PASSED! Ready for AWS Amplify deployment\n`
  );
  console.log('Next steps:');
  console.log(
    '  1. Commit any remaining changes: git add . && git commit -m "Your message"'
  );
  console.log('  2. Push to repository: git push origin master');
  console.log('  3. Monitor build in AWS Amplify Console\n');
  process.exit(0);
}
