#!/usr/bin/env node
/**
 * Generate dynamic security score badge
 * Updates the README with current security score
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

async function generateBadge() {
  try {
    // Run score-local.js and capture output
    const scoreOutput = execSync('node score-local.js', { 
      encoding: 'utf-8',
      cwd: __dirname + '/..',
      timeout: 30000 
    });
    
    // Extract score and band from output
    const scoreMatch = scoreOutput.match(/Score:\s*(\d+)\/100/);
    const bandMatch = scoreOutput.match(/Band:\s*(\w+)/);
    
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 100;
    const band = bandMatch ? bandMatch[1] : 'Safe';
    
    // Determine badge color based on score
    let color = 'brightgreen';
    if (score < 50) color = 'red';
    else if (score < 70) color = 'orange';
    else if (score < 90) color = 'yellow';
    
    // Generate badge URLs
    const scoreBadge = `https://img.shields.io/badge/security_score-${score}%2F100-${color}?style=flat-square`;
    const statusBadge = `https://img.shields.io/badge/status-${band.toLowerCase()}-${color}?style=flat-square`;
    const versionBadge = `https://img.shields.io/badge/version-0.1.0-blue?style=flat-square`;
    
    // Read README
    const readmePath = path.join(__dirname, '..', 'README.md');
    let readme = await fs.readFile(readmePath, 'utf-8');
    
    // Replace badge section
    const badgeSection = `![Security Score](${scoreBadge})
![Status](${statusBadge})
![Version](${versionBadge})`;
    
    // Find and replace the badge section
    const badgeRegex = /!\[Security Score\].*?\!\[Version\].*?\)/s;
    if (badgeRegex.test(readme)) {
      readme = readme.replace(badgeRegex, badgeSection);
    } else {
      // Insert after title if not found
      readme = readme.replace(
        /(# npm-security-score 🔒\n)/,
        `$1\n${badgeSection}\n`
      );
    }
    
    // Write back
    await fs.writeFile(readmePath, readme, 'utf-8');
    
    console.log(`✅ Badge updated: Score ${score}/100 (${band})`);
    console.log(`   Badge color: ${color}`);
    
  } catch (error) {
    console.error('❌ Error generating badge:', error.message);
    // Don't fail the build, just use default
    console.log('   Using default badge (100/100)');
    process.exit(0);
  }
}

generateBadge();

