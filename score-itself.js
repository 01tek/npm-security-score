#!/usr/bin/env node
/**
 * Score this package itself - the ultimate test!
 * The irony: a security scoring tool scoring itself!
 */

const ScoringService = require('./src/cli/scoringService');

async function scoreSelf() {
  console.log('🔒 Scoring npm-security-score itself...\n');
  console.log('(The irony: a security scoring tool scoring itself!)\n');
  
  const service = new ScoringService({ verbose: true });
  
  try {
    console.log('Fetching package data from npm registry...');
    const result = await service.scorePackage('npm-security-score', null);
    
    console.log('\n📊 Security Score Results:');
    console.log('═'.repeat(60));
    console.log(`Package: ${result.packageName || 'npm-security-score'}`);
    console.log(`Version: ${result.packageVersion || 'latest'}`);
    console.log(`Score: ${result.score}/100`);
    console.log(`Band: ${result.band}`);
    console.log(`\nRule Results:`);
    
    if (result.ruleResults && result.ruleResults.length > 0) {
      result.ruleResults.forEach(rule => {
        const impact = rule.deduction > 0 ? `-${rule.deduction}` : rule.bonus > 0 ? `+${rule.bonus}` : '0';
        const icon = rule.deduction > 0 ? '❌' : rule.bonus > 0 ? '✅' : '⚪';
        console.log(`  ${icon} ${rule.ruleName}: ${impact} points`);
      });
    } else {
      console.log('  (No rule results available)');
    }
    
    console.log('\n' + '═'.repeat(60));
    const verdict = result.score >= 80 ? '✅ Great! This package is secure!' : 
                   result.score >= 60 ? '⚠️  Needs improvement' : 
                   '❌ Critical issues found';
    console.log(`\n${verdict}`);
    console.log(`\nTimestamp: ${result.timestamp || new Date().toISOString()}`);
    
  } catch (error) {
    console.error('\n❌ Error scoring package:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Add timeout
const timeout = setTimeout(() => {
  console.error('\n⏱️  Timeout: Scoring took too long (>60s). This might be due to:');
  console.error('   - Network issues');
  console.error('   - npm registry being slow');
  console.error('   - GitHub API rate limiting');
  console.error('\nTry running: npm run score-self (if configured)');
  process.exit(1);
}, 60000);

scoreSelf()
  .then(() => {
    clearTimeout(timeout);
    process.exit(0);
  })
  .catch((error) => {
    clearTimeout(timeout);
    console.error('Fatal error:', error);
    process.exit(1);
  });

