#!/usr/bin/env node

const { spawn } = require('child_process');
const chokidar = require('chokidar');
const path = require('path');

const WATCH_PATTERNS = [
  'app/**/*.{ts,tsx,js,jsx}',
  'lambda/**/*.{ts,tsx,js,jsx}',
  'infrastructure/**/*.{ts,tsx,js,jsx}',
  '*.{ts,tsx,js,jsx,json}',
];

const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/.next/**',
  '**/dist/**',
  '**/out/**',
  '**/coverage/**',
  '**/cdk.out/**',
];

let isValidating = false;
let validationQueue = [];

function runValidation() {
  if (isValidating) {
    validationQueue.push('pending');
    return;
  }

  isValidating = true;
  console.log('\n🔄 Running validation...');

  const validation = spawn('npm', ['run', 'validate'], {
    stdio: 'inherit',
    shell: true,
  });

  validation.on('close', (code) => {
    isValidating = false;

    if (code === 0) {
      console.log('✅ Validation passed');
    } else {
      console.log('❌ Validation failed');
    }

    // Process queued validations
    if (validationQueue.length > 0) {
      validationQueue = [];
      setTimeout(runValidation, 1000); // Debounce
    }
  });
}

function startWatching() {
  console.log('👀 Starting file watcher for validation...');
  console.log('📁 Watching patterns:', WATCH_PATTERNS);

  const watcher = chokidar.watch(WATCH_PATTERNS, {
    ignored: IGNORE_PATTERNS,
    ignoreInitial: true,
    persistent: true,
  });

  watcher.on('change', (filePath) => {
    console.log(`📝 File changed: ${path.relative(process.cwd(), filePath)}`);
    setTimeout(runValidation, 500); // Debounce file changes
  });

  watcher.on('ready', () => {
    console.log('✅ File watcher is ready');
    console.log(
      '💡 Make changes to TypeScript/JavaScript files to trigger validation'
    );
    console.log('🛑 Press Ctrl+C to stop watching\n');
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n👋 Stopping file watcher...');
    watcher.close();
    process.exit(0);
  });
}

if (require.main === module) {
  startWatching();
}
