/**
 * Package analyzer utilities
 * Extracts and analyzes package metadata, scripts, and structure
 */

class PackageAnalyzer {
  /**
   * Extract lifecycle scripts from package.json
   * @param {Object} packageJson - Package.json object
   * @returns {Object} Lifecycle scripts grouped by type
   */
  static extractLifecycleScripts(packageJson) {
    if (!packageJson || typeof packageJson !== 'object') {
      return {};
    }

    const scripts = packageJson.scripts || {};
    const lifecycleScripts = {};

    // Common npm lifecycle hooks
    const lifecycleHooks = [
      'preinstall',
      'install',
      'postinstall',
      'prepublish',
      'prepublishOnly',
      'prepare',
      'prepack',
      'postpack',
      'prepublishOnly',
      'publish',
      'postpublish',
      'preversion',
      'version',
      'postversion',
    ];

    for (const hook of lifecycleHooks) {
      if (scripts[hook]) {
        lifecycleScripts[hook] = scripts[hook];
      }
    }

    return lifecycleScripts;
  }

  /**
   * Normalize script content
   * @param {string} script - Script content
   * @returns {string} Normalized script
   */
  static normalizeScript(script) {
    if (typeof script !== 'string') {
      return '';
    }

    // Remove extra whitespace
    return script.trim().replace(/\s+/g, ' ');
  }

  /**
   * Extract all scripts from package.json
   * @param {Object} packageJson - Package.json object
   * @returns {Object} All scripts
   */
  static extractAllScripts(packageJson) {
    if (!packageJson || typeof packageJson !== 'object') {
      return {};
    }

    return packageJson.scripts || {};
  }

  /**
   * Calculate package size metrics
   * @param {Object} packageData - Package metadata
   * @returns {Object} Size metrics
   */
  static calculateSizeMetrics(packageData) {
    const dist = packageData.dist || {};
    const unpackedSize = dist.unpackedSize || 0;
    const fileCount = dist.fileCount || 0;

    return {
      unpackedSize,
      fileCount,
      tarballSize: dist.size || 0,
    };
  }

  /**
   * Extract package dependencies
   * @param {Object} packageJson - Package.json object
   * @returns {Object} Dependencies grouped by type
   */
  static extractDependencies(packageJson) {
    if (!packageJson || typeof packageJson !== 'object') {
      return {
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        optionalDependencies: {},
      };
    }

    return {
      dependencies: packageJson.dependencies || {},
      devDependencies: packageJson.devDependencies || {},
      peerDependencies: packageJson.peerDependencies || {},
      optionalDependencies: packageJson.optionalDependencies || {},
    };
  }

  /**
   * Get package metadata summary
   * @param {Object} packageData - Package metadata
   * @returns {Object} Package summary
   */
  static getPackageSummary(packageData) {
    if (!packageData) {
      return null;
    }

    const scripts = this.extractAllScripts(packageData);
    const lifecycleScripts = this.extractLifecycleScripts(packageData);
    const dependencies = this.extractDependencies(packageData);
    const sizeMetrics = this.calculateSizeMetrics(packageData);

    return {
      name: packageData.name,
      version: packageData.version,
      description: packageData.description || '',
      author: packageData.author || null,
      maintainers: packageData.maintainers || [],
      repository: packageData.repository || null,
      homepage: packageData.homepage || null,
      license: packageData.license || null,
      scripts,
      lifecycleScripts,
      dependencies,
      sizeMetrics,
      hasScripts: Object.keys(scripts).length > 0,
      hasLifecycleScripts: Object.keys(lifecycleScripts).length > 0,
    };
  }
}

module.exports = PackageAnalyzer;
