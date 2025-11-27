/**
 * External Network Call Detection Rule
 * Detects network calls in package code and lifecycle scripts
 * Weight: -20 points
 */

const BaseRule = require('../core/BaseRule');
const PackageAnalyzer = require('../utils/packageAnalyzer');
// eslint-disable-next-line node/no-unpublished-require
const parser = require('@babel/parser');
// eslint-disable-next-line node/no-unpublished-require
const traverse = require('@babel/traverse').default;

class ExternalNetworkCallRule extends BaseRule {
  constructor(weight = 20) {
    super(
      'external-network-call',
      weight,
      'Detects external network calls in package code and lifecycle scripts'
    );

    // Network-related module names
    this.networkModules = [
      'http',
      'https',
      'http2',
      'request',
      'axios',
      'node-fetch',
      'got',
      'superagent',
      'needle',
      'phin',
    ];

    // Network call patterns for string matching (lifecycle scripts)
    this.networkPatterns = [
      /\bfetch\s*\(/i,
      /\bXMLHttpRequest/i,
      /\brequire\s*\(\s*['"]https?['"]\s*\)/i,
      /\brequire\s*\(\s*['"]http['"]\s*\)/i,
      /\brequire\s*\(\s*['"]https['"]\s*\)/i,
      /\brequire\s*\(\s*['"]request['"]\s*\)/i,
      /\brequire\s*\(\s*['"]axios['"]\s*\)/i,
      /\bimport\s+.*\s+from\s+['"]https?:\/\//i,
      /\bimport\s*\(\s*['"]https?:\/\//i,
      /\bdynamicImport\s*\(/i,
    ];
  }

  /**
   * Evaluate package for external network calls
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

    // 1. Check lifecycle scripts for network calls
    const lifecycleScripts = PackageAnalyzer.extractLifecycleScripts(packageData);
    for (const [hook, script] of Object.entries(lifecycleScripts)) {
      const scriptFindings = this._analyzeScript(script, hook);
      if (scriptFindings.length > 0) {
        findings.push({
          source: 'lifecycle-script',
          hook,
          script: PackageAnalyzer.normalizeScript(script),
          findings: scriptFindings,
          risk: scriptFindings.length,
        });
        totalRisk += scriptFindings.length;
      }
    }

    // 2. Analyze package code if available
    // This would require extracting and analyzing files from tarball
    // For now, we'll focus on lifecycle scripts and package.json analysis

    // 3. Check for network modules in dependencies
    const dependencies = PackageAnalyzer.extractDependencies(packageData);
    const networkDeps = this._checkNetworkDependencies(dependencies);
    if (networkDeps.length > 0) {
      findings.push({
        source: 'dependencies',
        findings: networkDeps,
        risk: networkDeps.length,
      });
      totalRisk += networkDeps.length * 0.5; // Lower risk for dependencies
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
        hasNetworkCalls: findings.length > 0,
      },
      riskLevel:
        totalRisk >= 3 ? 'high' : totalRisk >= 2 ? 'medium' : totalRisk >= 1 ? 'low' : 'none',
    };
  }

  /**
   * Analyze a script for network calls
   * @private
   */
  _analyzeScript(script, _hook) {
    const findings = [];

    // Check for network patterns
    for (const pattern of this.networkPatterns) {
      if (pattern.test(script)) {
        findings.push({
          type: 'network-pattern',
          pattern: pattern.toString(),
          description: 'Network call pattern detected in lifecycle script',
        });
      }
    }

    // Try to parse as JavaScript and analyze AST
    try {
      const ast = parser.parse(script, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        plugins: ['dynamicImport'],
      });

      const astFindings = this._analyzeAST(ast);
      findings.push(...astFindings);
    } catch (error) {
      // Script might not be valid JavaScript, that's okay
      // We already checked for string patterns above
    }

    return findings;
  }

  /**
   * Analyze AST for network calls
   * @private
   */
  _analyzeAST(ast) {
    const findings = [];
    const rule = this; // Capture 'this' for use in callbacks

    traverse(ast, {
      // Detect require('http') or require('https')
      CallExpression(path) {
        const { node } = path;

        // Check for require() calls
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'require' &&
          node.arguments.length > 0
        ) {
          const arg = node.arguments[0];
          if (arg.type === 'StringLiteral') {
            const moduleName = arg.value;
            if (rule.networkModules.includes(moduleName)) {
              findings.push({
                type: 'require-network-module',
                module: moduleName,
                description: `Requires network module: ${moduleName}`,
              });
            }
          }
        }

        // Check for fetch() calls
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'fetch' &&
          node.arguments.length > 0
        ) {
          const arg = node.arguments[0];
          if (arg.type === 'StringLiteral' && rule._isUrl(arg.value)) {
            findings.push({
              type: 'fetch-call',
              url: arg.value,
              description: `fetch() call with URL: ${arg.value}`,
            });
          }
        }

        // Check for dynamic import() with URLs
        if (node.callee.type === 'Import' && node.arguments.length > 0) {
          const arg = node.arguments[0];
          if (arg.type === 'StringLiteral' && rule._isUrl(arg.value)) {
            findings.push({
              type: 'dynamic-import-url',
              url: arg.value,
              description: `Dynamic import from URL: ${arg.value}`,
            });
          }
        }

        // Check for eval() with potential network content
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'eval' &&
          node.arguments.length > 0
        ) {
          const arg = node.arguments[0];
          if (arg.type === 'StringLiteral' && rule._containsNetworkPattern(arg.value)) {
            findings.push({
              type: 'eval-network',
              description: 'eval() with potential network-related code',
            });
          }
        }
      },

      // Detect import statements with URLs
      ImportDeclaration(path) {
        const { node } = path;
        if (node.source.type === 'StringLiteral' && rule._isUrl(node.source.value)) {
          findings.push({
            type: 'import-url',
            url: node.source.value,
            description: `Import from URL: ${node.source.value}`,
          });
        }
      },

      // Detect new XMLHttpRequest()
      NewExpression(path) {
        const { node } = path;
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'XMLHttpRequest'
        ) {
          findings.push({
            type: 'xhr-usage',
            description: 'XMLHttpRequest usage detected',
          });
        }
      },
    });

    return findings;
  }

  /**
   * Check if a string is a URL
   * @private
   */
  _isUrl(str) {
    if (typeof str !== 'string') return false;
    try {
      const url = new URL(str);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Check if string contains network-related patterns
   * @private
   */
  _containsNetworkPattern(str) {
    if (typeof str !== 'string') return false;
    return (
      /https?:\/\//.test(str) ||
      /\bfetch\s*\(/.test(str) ||
      /\bXMLHttpRequest/.test(str) ||
      /\brequire\s*\(\s*['"]https?['"]/.test(str)
    );
  }

  /**
   * Check dependencies for network modules
   * @private
   */
  _checkNetworkDependencies(dependencies) {
    const findings = [];
    const allDeps = {
      ...dependencies.dependencies,
      ...dependencies.devDependencies,
      ...dependencies.optionalDependencies,
    };

    for (const [depName, version] of Object.entries(allDeps)) {
      // Check if dependency name matches network modules
      if (this.networkModules.some((module) => depName.includes(module))) {
        findings.push({
          type: 'network-dependency',
          package: depName,
          version,
          description: `Network-related dependency: ${depName}`,
        });
      }
    }

    return findings;
  }
}

module.exports = ExternalNetworkCallRule;

