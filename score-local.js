#!/usr/bin/env node
/**
 * Score this package locally - analyze the current codebase!
 * The irony: a security scoring tool scoring itself!
 */

const fs = require('fs').promises;
const path = require('path');
const ScoreCalculator = require('./src/core/ScoreCalculator');
const RuleRegistry = require('./src/core/RuleRegistry');
const PackageAnalyzer = require('./src/utils/packageAnalyzer');

// Import all rules
const LifecycleScriptRiskRule = require('./src/rules/LifecycleScriptRiskRule');
const ExternalNetworkCallRule = require('./src/rules/ExternalNetworkCallRule');
const CodeObfuscationRule = require('./src/rules/CodeObfuscationRule');
const UpdateBehaviorRule = require('./src/rules/UpdateBehaviorRule');
const CommunitySignalsRule = require('./src/rules/CommunitySignalsRule');
const VerifiedPublisherRule = require('./src/rules/VerifiedPublisherRule');
const SignedReleasesRule = require('./src/rules/SignedReleasesRule');
const SBOMDetectionRule = require('./src/rules/SBOMDetectionRule');

async function scoreLocal() {
  console.log('🔒 Scoring npm-security-score (LOCAL VERSION)...\n');
  console.log('(The irony: a security scoring tool scoring itself!)\n');
  
  try {
    // Read local package.json
    const packageJsonPath = path.join(__dirname, 'package.json');
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
    const packageData = JSON.parse(packageJsonContent);
    
    // Analyze the package
    const scripts = PackageAnalyzer.extractLifecycleScripts(packageData);
    const dependencies = PackageAnalyzer.extractDependencies(packageData);
    
    // Create package metadata object
    const packageMetadata = {
      name: packageData.name,
      version: packageData.version,
      description: packageData.description,
      scripts: packageData.scripts || {},
      dependencies: dependencies.dependencies,
      devDependencies: dependencies.devDependencies,
      repository: packageData.repository,
      author: packageData.author,
      license: packageData.license,
      homepage: packageData.homepage,
      // Add analysis results
      hasScripts: Object.keys(scripts).length > 0,
      lifecycleScripts: scripts,
    };
    
    // Setup scoring
    const ruleRegistry = new RuleRegistry();
    const scoreCalculator = new ScoreCalculator();
    
    // Register rules (only ones that work without external APIs for local scoring)
    ruleRegistry.register(new LifecycleScriptRiskRule());
    ruleRegistry.register(new CodeObfuscationRule());
    // Skip rules that need external APIs or tarball analysis for now
    // ruleRegistry.register(new ExternalNetworkCallRule()); // Needs file analysis
    // ruleRegistry.register(new UpdateBehaviorRule()); // Needs version history
    // ruleRegistry.register(new CommunitySignalsRule()); // Needs GitHub API
    ruleRegistry.register(new VerifiedPublisherRule());
    ruleRegistry.register(new SignedReleasesRule());
    ruleRegistry.register(new SBOMDetectionRule());
    
    scoreCalculator.ruleRegistry = ruleRegistry;
    
    console.log('Analyzing package...');
    const result = await scoreCalculator.calculateScore(packageMetadata);
    
    console.log('\n📊 Security Score Results:');
    console.log('═'.repeat(60));
    console.log(`Package: ${result.packageName || packageData.name}`);
    console.log(`Version: ${result.packageVersion || packageData.version}`);
    console.log(`Score: ${result.score}/100`);
    console.log(`Band: ${typeof result.band === 'object' ? result.band.name || result.band.label || 'Unknown' : result.band}`);
    console.log(`\nRule Results:`);
    
    if (result.ruleResults && result.ruleResults.length > 0) {
      result.ruleResults.forEach(rule => {
        const impact = rule.deduction > 0 ? `-${rule.deduction}` : rule.bonus > 0 ? `+${rule.bonus}` : '0';
        const icon = rule.deduction > 0 ? '❌' : rule.bonus > 0 ? '✅' : '⚪';
        console.log(`  ${icon} ${rule.ruleName}: ${impact} points`);
        if (rule.details && Object.keys(rule.details).length > 0) {
          Object.entries(rule.details).forEach(([key, value]) => {
            if (typeof value !== 'object') {
              console.log(`      ${key}: ${value}`);
            }
          });
        }
      });
    }
    
    console.log('\n' + '═'.repeat(60));
    const verdict = result.score >= 80 ? '✅ Great! This package is secure!' : 
                   result.score >= 60 ? '⚠️  Needs improvement' : 
                   '❌ Critical issues found';
    console.log(`\n${verdict}`);
    console.log(`\nTimestamp: ${result.timestamp || new Date().toISOString()}`);
    
    // Show some stats
    console.log('\n📈 Quick Stats:');
    console.log(`  - Lifecycle scripts: ${Object.keys(scripts).length}`);
    console.log(`  - Dependencies: ${Object.keys(dependencies.dependencies || {}).length}`);
    console.log(`  - Dev dependencies: ${Object.keys(dependencies.devDependencies || {}).length}`);
    
  } catch (error) {
    console.error('\n❌ Error scoring package:', error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

scoreLocal();

