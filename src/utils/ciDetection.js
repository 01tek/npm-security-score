/**
 * CI/CD Environment Detection
 * Detects various CI/CD environments and provides configuration
 */

class CIDetection {
  /**
   * Detect if running in CI environment
   * @returns {boolean}
   */
  static isCI() {
    return (
      process.env.CI === 'true' ||
      process.env.GITHUB_ACTIONS === 'true' ||
      process.env.GITLAB_CI === 'true' ||
      process.env.JENKINS_URL !== undefined ||
      process.env.CIRCLECI === 'true' ||
      process.env.TRAVIS === 'true' ||
      process.env.CONTINUOUS_INTEGRATION === 'true' ||
      process.env.BUILDKITE === 'true' ||
      process.env.TEAMCITY_VERSION !== undefined ||
      process.env.BAMBOO_BUILDKEY !== undefined ||
      process.env.GO_PIPELINE_NAME !== undefined
    );
  }

  /**
   * Detect specific CI platform
   * @returns {string|null} CI platform name or null
   */
  static detectPlatform() {
    if (process.env.GITHUB_ACTIONS === 'true') return 'github-actions';
    if (process.env.GITLAB_CI === 'true') return 'gitlab-ci';
    if (process.env.JENKINS_URL !== undefined) return 'jenkins';
    if (process.env.CIRCLECI === 'true') return 'circleci';
    if (process.env.TRAVIS === 'true') return 'travis';
    if (process.env.BUILDKITE === 'true') return 'buildkite';
    if (process.env.TEAMCITY_VERSION !== undefined) return 'teamcity';
    if (process.env.BAMBOO_BUILDKEY !== undefined) return 'bamboo';
    if (process.env.GO_PIPELINE_NAME !== undefined) return 'gocd';
    if (process.env.CI === 'true') return 'generic';
    return null;
  }

  /**
   * Get CI-specific configuration
   * @returns {Object} Configuration object
   */
  static getConfig() {
    const platform = this.detectPlatform();
    const config = {
      isCI: this.isCI(),
      platform,
      colors: false,
      interactive: false,
    };

    // Platform-specific configurations
    switch (platform) {
      case 'github-actions':
        config.workflow = process.env.GITHUB_WORKFLOW;
        config.runId = process.env.GITHUB_RUN_ID;
        config.prNumber = process.env.GITHUB_PR_NUMBER;
        break;
      case 'gitlab-ci':
        config.pipelineId = process.env.CI_PIPELINE_ID;
        config.mergeRequest = process.env.CI_MERGE_REQUEST_ID;
        break;
      case 'jenkins':
        config.buildNumber = process.env.BUILD_NUMBER;
        config.buildUrl = process.env.BUILD_URL;
        break;
    }

    return config;
  }

  /**
   * Get exit code for CI/CD
   * @param {number} score - Security score
   * @param {number} threshold - Failure threshold
   * @returns {number} Exit code (0 for success, 1 for failure)
   */
  static getExitCode(score, threshold = 70) {
    return score >= threshold ? 0 : 1;
  }
}

module.exports = CIDetection;
