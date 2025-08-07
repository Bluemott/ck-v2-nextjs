#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function runCommand(command, description) {
  console.log(`\n🔍 ${description}...`);
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stderr && !stderr.includes('Warning')) {
      console.error(`❌ ${description} failed:`);
      console.error(stderr);
      return false;
    }
    if (stdout) {
      console.log(stdout);
    }
    console.log(`✅ ${description} passed`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`);
    console.error(error.stdout || error.message);
    return false;
  }
}

async function validateCode() {
  console.log('🚀 Starting comprehensive code validation...\n');

  const checks = [
    { cmd: 'npm run type-check', desc: 'TypeScript type checking' },
    { cmd: 'npm run lint:strict', desc: 'ESLint validation (strict)' },
    { cmd: 'npm run health-check', desc: 'Basic health checks' },
  ];

  let allPassed = true;

  for (const check of checks) {
    const passed = await runCommand(check.cmd, check.desc);
    if (!passed) {
      allPassed = false;
    }
  }

  console.log('\n' + '='.repeat(50));

  if (allPassed) {
    console.log('🎉 All validation checks passed! Code is ready for build.');
    process.exit(0);
  } else {
    console.log(
      '💥 Some validation checks failed. Please fix the issues above.'
    );
    console.log('\n📝 Quick fixes:');
    console.log('   • Run: npm run validate:fix');
    console.log('   • Or: npm run lint:fix && npm run type-check');
    process.exit(1);
  }
}

if (require.main === module) {
  validateCode();
}

module.exports = { validateCode, runCommand };
