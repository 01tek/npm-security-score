#!/usr/bin/env node

/**
 * GitHub Action for npm-security-score
 * Scores npm packages and optionally comments on PRs
 */

const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

const ScoringService = require('../src/cli/scoringService');
const OutputFormatter = require('../src/cli/outputFormatter');
const config = require('../src/utils/config');

async function run() {
  try {
    // Get inputs
    const packageInput = core.getInput('package');
    const failBelow = parseFloat(core.getInput('fail-below')) || 70;
    const configPath = core.getInput('config');
    const githubToken = core.getInput('github-token');
    const commentOnPR = core.getInput('comment-on-pr') === 'true';
    const jsonOutput = core.getInput('json-output') === 'true';
    const verbose = core.getInput('verbose') === 'true';

    // Load config if provided
    if (configPath) {
      await config.loadFromFile(configPath);
    }

    // Initialize services
    const scoringService = new ScoringService({
      config: config.getAll(),
      verbose,
    });
    const formatter = new OutputFormatter({
      json: jsonOutput,
      verbose,
    });

    // Determine what to score
    let packagesToScore = [];
    let isDependencyScan = false;

    if (packageInput === 'package.json' || packageInput.endsWith('package.json')) {
      // Scan dependencies from package.json
      isDependencyScan = true;
      const packageJsonPath = path.resolve(packageInput);
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

      const allDeps = {
        ...(packageJson.dependencies || {}),
        ...(packageJson.devDependencies || {}),
        ...(packageJson.peerDependencies || {}),
        ...(packageJson.optionalDependencies || {}),
      };

      packagesToScore = Object.keys(allDeps).map((name) => {
        const version = allDeps[name];
        return version ? `${name}@${version.replace(/^[\^~]/, '')}` : name;
      });

      core.info(`Found ${packagesToScore.length} dependencies to score`);
    } else {
      // Score specific package(s)
      packagesToScore = packageInput.split(',').map((p) => p.trim());
    }

    if (packagesToScore.length === 0) {
      core.setFailed('No packages to score');
      return;
    }

    // Score packages
    core.info(`Scoring ${packagesToScore.length} package(s)...`);
    const results = await scoringService.scorePackages(packagesToScore);

    // Process results
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);
    const belowThreshold = successful.filter(
      (r) => r.result.score < failBelow
    );

    // Calculate summary
    const avgScore =
      successful.length > 0
        ? successful.reduce((sum, r) => sum + r.result.score, 0) /
          successful.length
        : 0;

    // Set outputs
    if (successful.length === 1) {
      const result = successful[0].result;
      core.setOutput('score', result.score);
      core.setOutput('band', result.band.key);
      core.setOutput('passed', result.score >= failBelow);
      core.setOutput('report', JSON.stringify(result));
    } else {
      core.setOutput('score', avgScore);
      core.setOutput('band', avgScore >= 90 ? 'SAFE' : avgScore >= 70 ? 'REVIEW' : avgScore >= 50 ? 'HIGH_RISK' : 'BLOCK');
      core.setOutput('passed', avgScore >= failBelow && belowThreshold.length === 0);
      core.setOutput('report', JSON.stringify(results));
    }

    // Generate report
    const report = formatter.formatResults(results);
    core.info('\n' + report);

    // Comment on PR if requested
    if (commentOnPR && githubToken && github.context.eventName === 'pull_request') {
      await commentOnPullRequest(
        githubToken,
        results,
        avgScore,
        belowThreshold,
        isDependencyScan
      );
    }

    // Fail if below threshold
    if (belowThreshold.length > 0) {
      core.setFailed(
        `${belowThreshold.length} package(s) scored below threshold ${failBelow}`
      );
      belowThreshold.forEach((item) => {
        core.error(
          `  - ${item.result.packageName}@${item.result.packageVersion}: ${item.result.score}`
        );
      });
    } else if (failed.length > 0) {
      core.setFailed(`${failed.length} package(s) failed to score`);
    } else if (successful.length > 0 && avgScore < failBelow) {
      core.setFailed(
        `Average score ${avgScore.toFixed(2)} is below threshold ${failBelow}`
      );
    } else {
      core.info(`✅ All packages passed security check (avg score: ${avgScore.toFixed(2)})`);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

/**
 * Comment on pull request with results
 */
async function commentOnPullRequest(
  token,
  results,
  avgScore,
  belowThreshold,
  isDependencyScan
) {
  try {
    const octokit = github.getOctokit(token);
    const context = github.context;

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    let comment = `## 🔒 Security Score Results\n\n`;
    comment += `**Average Score:** ${avgScore.toFixed(2)}/100\n\n`;

    if (isDependencyScan) {
      comment += `**Dependencies Scanned:** ${results.length}\n`;
      comment += `**Passed:** ${successful.length}\n`;
      if (failed.length > 0) {
        comment += `**Failed:** ${failed.length}\n`;
      }
      comment += `\n`;
    }

    if (belowThreshold.length > 0) {
      comment += `### ⚠️ Packages Below Threshold\n\n`;
      belowThreshold.forEach((item) => {
        const result = item.result;
        comment += `- **${result.packageName}@${result.packageVersion}**: ${result.score}/100 ${result.band.emoji}\n`;
      });
      comment += `\n`;
    }

    if (successful.length > 0) {
      comment += `### 📊 Top Issues\n\n`;
      const topIssues = successful
        .map((r) => r.result)
        .sort((a, b) => a.score - b.score)
        .slice(0, 5);

      topIssues.forEach((result) => {
        comment += `- **${result.packageName}@${result.packageVersion}**: ${result.score}/100 ${result.band.emoji}\n`;
      });
    }

    comment += `\n---\n*Generated by [npm-security-score](https://github.com/01tek/npm-security-score)*`;

    // Find existing comment
    const { data: comments } = await octokit.rest.issues.listComments({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.payload.pull_request.number,
    });

    const existingComment = comments.find(
      (c) => c.user.type === 'Bot' && c.body.includes('Security Score Results')
    );

    if (existingComment) {
      // Update existing comment
      await octokit.rest.issues.updateComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        comment_id: existingComment.id,
        body: comment,
      });
    } else {
      // Create new comment
      await octokit.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: context.payload.pull_request.number,
        body: comment,
      });
    }
  } catch (error) {
    core.warning(`Failed to comment on PR: ${error.message}`);
  }
}

// Run the action
if (require.main === module) {
  run();
}

module.exports = { run };

