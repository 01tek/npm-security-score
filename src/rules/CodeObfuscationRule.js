/**
 * Code Obfuscation Detection Rule
 * Detects obfuscated, minified, and suspicious code patterns
 * Weight: -10 points
 */

const BaseRule = require('../core/BaseRule');
const TarballAnalyzer = require('../utils/tarballAnalyzer');
const PackageAnalyzer = require('../utils/packageAnalyzer');

class CodeObfuscationRule extends BaseRule {
  constructor(weight = 10, config = {}) {
    super(
      'code-obfuscation',
      weight,
      'Detects obfuscated, minified, and suspicious code patterns'
    );

    this.maxMinifiedSize = config.maxMinifiedSize || 5 * 1024 * 1024; // 5MB default
    this.entropyThreshold = config.entropyThreshold || 7.5; // High entropy threshold
    this.suspiciousSizeIncrease = config.suspiciousSizeIncrease || 0.5; // 50% increase
  }

  /**
   * Evaluate package for code obfuscation
   * @param {PackageMetadata} packageData - Package metadata
   * @returns {Promise<RuleResult>} Evaluation result
   */
  async evaluate(packageData) {
    if (!this.isEnabled()) {
      return {
        deduction: 0,
        details: { reason: 'Rule is disabled' },
        riskLevel: 'none',
      };
    }

    const findings = [];
    let totalRisk = 0;

    // 1. Check package size metrics
    const sizeMetrics = PackageAnalyzer.calculateSizeMetrics(packageData);
    if (sizeMetrics.unpackedSize > this.maxMinifiedSize) {
      findings.push({
        type: 'large-package-size',
        size: sizeMetrics.unpackedSize,
        threshold: this.maxMinifiedSize,
        description: `Package size (${this._formatBytes(sizeMetrics.unpackedSize)}) exceeds threshold`,
        severity: 'medium',
      });
      totalRisk += 1;
    }

    // 2. Analyze tarball if available
    // Note: This would require downloading and extracting the tarball
    // For now, we'll analyze based on available metadata
    const tarballUrl = packageData.dist?.tarball;
    if (tarballUrl) {
      try {
        const tarballFindings = await this._analyzeTarball(
          tarballUrl,
          packageData.name
        );
        findings.push(...tarballFindings);
        totalRisk += tarballFindings.length;
      } catch (error) {
        // Tarball analysis failed - don't penalize, but log
        findings.push({
          type: 'tarball-analysis-error',
          description: `Could not analyze tarball: ${error.message}`,
          severity: 'low',
        });
      }
    }

    // 3. Check for suspicious file patterns in package.json
    const suspiciousFiles = this._checkSuspiciousFilePatterns(packageData);
    if (suspiciousFiles.length > 0) {
      findings.push({
        type: 'suspicious-file-patterns',
        files: suspiciousFiles,
        description: `Found ${suspiciousFiles.length} suspicious file patterns`,
        severity: 'medium',
      });
      totalRisk += suspiciousFiles.length * 0.5;
    }

    // Calculate deduction based on findings
    let deduction = 0;
    if (totalRisk >= 3) {
      // High risk - full deduction
      deduction = this.weight;
    } else if (totalRisk >= 2) {
      // Medium risk - partial deduction
      deduction = Math.floor(this.weight * 0.75);
    } else if (totalRisk >= 1) {
      // Low risk - small deduction
      deduction = Math.floor(this.weight * 0.5);
    }

    return {
      deduction,
      details: {
        findings,
        totalRisk: Math.round(totalRisk * 10) / 10,
        hasObfuscation: findings.length > 0,
        packageSize: sizeMetrics.unpackedSize,
      },
      riskLevel:
        totalRisk >= 3 ? 'high' : totalRisk >= 2 ? 'medium' : totalRisk >= 1 ? 'low' : 'none',
    };
  }

  /**
   * Analyze tarball for obfuscation
   * @private
   */
  async _analyzeTarball(tarballUrl, packageName) {
    const findings = [];
    const analyzer = new TarballAnalyzer();

    const analysis = await analyzer.analyzeTarball(tarballUrl, packageName);

    if (!analysis.hasPackageJson) {
      findings.push({
        type: 'missing-package-json',
        description: 'Package tarball does not contain package.json',
        severity: 'high',
      });
    }

    // Check for large minified files
    if (analysis.largestFiles && analysis.largestFiles.length > 0) {
      for (const file of analysis.largestFiles) {
        if (file.size > this.maxMinifiedSize) {
          findings.push({
            type: 'large-minified-file',
            file: file.path,
            size: file.size,
            description: `Large file detected: ${file.path} (${this._formatBytes(file.size)})`,
            severity: 'medium',
          });
        }

        // Check file extension for minified patterns
        if (this._isMinifiedFile(file.path)) {
          findings.push({
            type: 'minified-file',
            file: file.path,
            size: file.size,
            description: `Minified file detected: ${file.path}`,
            severity: 'low',
          });
        }
      }
    }

    // Check total file count (suspicious if very high)
    if (analysis.totalFiles > 10000) {
      findings.push({
        type: 'excessive-file-count',
        fileCount: analysis.totalFiles,
        description: `Excessive number of files: ${analysis.totalFiles}`,
        severity: 'low',
      });
    }

    return findings;
  }

  /**
   * Check if file path indicates minified/obfuscated file
   * @private
   */
  _isMinifiedFile(filePath) {
    const minifiedPatterns = [
      /\.min\.js$/i,
      /\.min\.css$/i,
      /\.bundle\.js$/i,
      /\.chunk\.js$/i,
      /\.vendor\.js$/i,
      /\.obfuscated\.js$/i,
      /\.pack\.js$/i,
    ];

    return minifiedPatterns.some((pattern) => pattern.test(filePath));
  }

  /**
   * Check for suspicious file patterns
   * @private
   */
  _checkSuspiciousFilePatterns(packageData) {
    const suspiciousFiles = [];

    // Check files field in package.json
    if (packageData.files && Array.isArray(packageData.files)) {
      for (const file of packageData.files) {
        if (this._isSuspiciousFile(file)) {
          suspiciousFiles.push(file);
        }
      }
    }

    return suspiciousFiles;
  }

  /**
   * Check if file name is suspicious
   * @private
   */
  _isSuspiciousFile(fileName) {
    const suspiciousPatterns = [
      /\.min\.js$/i,
      /\.pack\.js$/i,
      /\.obfuscated\.js$/i,
      /\.bundle\.js$/i,
      /obfuscat/i,
      /minified/i,
      /packed/i,
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(fileName));
  }

  /**
   * Calculate file entropy (Shannon entropy)
   * Higher entropy indicates more randomness/obfuscation
   * @private
   */
  _calculateEntropy(content) {
    if (!content || content.length === 0) return 0;

    const frequencies = {};
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      frequencies[char] = (frequencies[char] || 0) + 1;
    }

    let entropy = 0;
    const length = content.length;

    for (const char in frequencies) {
      const frequency = frequencies[char] / length;
      entropy -= frequency * Math.log2(frequency);
    }

    return entropy;
  }

  /**
   * Format bytes to human-readable string
   * @private
   */
  _formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Check if content appears obfuscated based on entropy
   * @private
   */
  _isObfuscatedContent(content) {
    if (!content || typeof content !== 'string') return false;

    const entropy = this._calculateEntropy(content);
    return entropy > this.entropyThreshold;
  }
}

module.exports = CodeObfuscationRule;

