const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Checking workspace configuration...');

try {
  // Check root package.json
  const rootPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('✅ Root package.json found');
  
  if (rootPackage.workspaces) {
    console.log('📦 Workspaces configured:', rootPackage.workspaces);
  } else {
    console.log('⚠️ No workspaces configured in root package.json');
  }

  // Check each workspace
  const workspaces = ['infrastructure', 'lambda/graphql'];
  
  for (const workspace of workspaces) {
    const workspacePath = path.join(workspace, 'package.json');
    if (fs.existsSync(workspacePath)) {
      const workspacePackage = JSON.parse(fs.readFileSync(workspacePath, 'utf8'));
      console.log(`✅ ${workspace}: ${workspacePackage.name} v${workspacePackage.version}`);
      
      // Check if workspace has build script
      if (workspacePackage.scripts && workspacePackage.scripts.build) {
        console.log(`  📦 Has build script: ${workspacePackage.scripts.build}`);
      } else {
        console.log(`  ⚠️  No build script found`);
      }
    } else {
      console.log(`❌ ${workspace}: package.json not found`);
    }
  }

  // Check node_modules
  console.log('\n📁 Checking node_modules...');
  if (fs.existsSync('node_modules')) {
    console.log('✅ Root node_modules exists');
  } else {
    console.log('❌ Root node_modules missing');
  }

  for (const workspace of workspaces) {
    const nodeModulesPath = path.join(workspace, 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      console.log(`✅ ${workspace}/node_modules exists`);
    } else {
      console.log(`❌ ${workspace}/node_modules missing`);
    }
  }

  console.log('\n✅ Workspace check completed');

} catch (error) {
  console.error('❌ Workspace check failed:', error.message);
  process.exit(1);
} 