#!/usr/bin/env node

/**
 * Prepare for Amplify Deployment
 * Checks project status and prepares for GitHub push
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Preparing for Amplify Deployment');
console.log('==================================\n');

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

async function checkGitStatus() {
  log('Checking Git status...');
  
  try {
    // Check if git is initialized
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    
    if (gitStatus.trim()) {
      log('Uncommitted changes found:', 'info');
      console.log(gitStatus);
      
      return {
        hasChanges: true,
        needsCommit: true
      };
    } else {
      log('Git working directory is clean', 'success');
      return {
        hasChanges: false,
        needsCommit: false
      };
    }
  } catch (error) {
    log('Git not initialized or error occurred', 'error');
    return {
      hasChanges: true,
      needsCommit: true,
      error: error.message
    };
  }
}

async function checkEnvironmentFile() {
  log('Checking environment configuration...');
  
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    
    const hasAWSGraphQL = envContent.includes('NEXT_PUBLIC_USE_AWS_GRAPHQL=true');
    const hasGraphQLURL = envContent.includes('NEXT_PUBLIC_AWS_GRAPHQL_URL=https://');
    
    if (hasAWSGraphQL && hasGraphQLURL) {
      log('Environment file properly configured for AWS', 'success');
      return true;
    } else {
      log('Environment file needs AWS configuration', 'error');
      return false;
    }
  } catch (error) {
    log('Could not read .env.local file', 'error');
    return false;
  }
}

async function checkAmplifyConfig() {
  log('Checking Amplify configuration...');
  
  try {
    const amplifyContent = fs.readFileSync('amplify.yml', 'utf8');
    
    if (amplifyContent.includes('npm run build') && amplifyContent.includes('.next')) {
      log('Amplify configuration is ready for Next.js', 'success');
      return true;
    } else {
      log('Amplify configuration may need updates', 'error');
      return false;
    }
  } catch (error) {
    log('Could not read amplify.yml file', 'error');
    return false;
  }
}

async function testAPIConnection() {
  log('Testing API connection...');
  
  try {
    const testResult = execSync('node scripts/test-graphql-api.js', { encoding: 'utf8' });
    
    if (testResult.includes('Response received') && testResult.includes('Test Post')) {
      log('API is responding correctly', 'success');
      return true;
    } else {
      log('API test failed or returned unexpected data', 'error');
      return false;
    }
  } catch (error) {
    log('Could not test API connection', 'error');
    return false;
  }
}

async function generateDeploymentSummary() {
  log('\n📋 Generating deployment summary...');
  
  const summary = {
    timestamp: new Date().toISOString(),
    apiEndpoint: 'https://0m6piyoypi.execute-api.us-east-1.amazonaws.com/prod/graphql',
    status: 'Ready for Amplify deployment',
    environment: {
      useAWSGraphQL: true,
      graphqlURL: 'Configured',
      amplifyConfig: 'Ready'
    },
    nextSteps: [
      '1. Commit changes to Git',
      '2. Push to GitHub repository', 
      '3. Set up Amplify app in AWS Console',
      '4. Connect GitHub repository',
      '5. Deploy and get live URL'
    ]
  };
  
  fs.writeFileSync('deployment-summary.json', JSON.stringify(summary, null, 2));
  log('Deployment summary saved to deployment-summary.json', 'success');
  
  return summary;
}

async function main() {
  try {
    log('🚀 Starting deployment preparation...');
    
    // Check all prerequisites
    const gitStatus = await checkGitStatus();
    const envReady = await checkEnvironmentFile();
    const amplifyReady = await checkAmplifyConfig();
    const apiWorking = await testAPIConnection();
    
    // Generate summary
    const summary = await generateDeploymentSummary();
    
    console.log('\n' + '='.repeat(50));
    console.log('DEPLOYMENT READINESS SUMMARY');
    console.log('='.repeat(50));
    
    console.log(`✅ Environment Config: ${envReady ? 'Ready' : 'Needs Fix'}`);
    console.log(`✅ Amplify Config: ${amplifyReady ? 'Ready' : 'Needs Fix'}`);
    console.log(`✅ API Status: ${apiWorking ? 'Working' : 'Needs Fix'}`);
    console.log(`📝 Git Status: ${gitStatus.needsCommit ? 'Needs Commit' : 'Clean'}`);
    
    if (envReady && amplifyReady && apiWorking) {
      log('\n🎉 PROJECT IS READY FOR AMPLIFY DEPLOYMENT!', 'success');
      
      console.log('\n📋 Next Steps:');
      console.log('1. Run: git add . && git commit -m "feat: Ready for Amplify deployment"');
      console.log('2. Run: git push origin main');
      console.log('3. Go to AWS Amplify Console');
      console.log('4. Connect your GitHub repository');
      console.log('5. Deploy and get your live dev URL!');
      
      console.log('\n🌐 Expected Live URL:');
      console.log('https://main.d[random-id].amplifyapp.com');
      
      console.log('\n💡 Benefits:');
      console.log('- Test API from anywhere');
      console.log('- Stable environment for data migration');
      console.log('- Real CloudFront CDN testing');
      console.log('- Team can test simultaneously');
    } else {
      log('\n🔧 Some issues need to be resolved before deployment', 'error');
      
      if (!envReady) console.log('- Fix environment variables in .env.local');
      if (!amplifyReady) console.log('- Check amplify.yml configuration');
      if (!apiWorking) console.log('- Resolve API connectivity issues');
    }
    
  } catch (error) {
    log(`Preparation failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}