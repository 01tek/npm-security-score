/**
 * npm-security-score
 * World-class security scoring system for npm packages
 */

const ScoreCalculator = require('./core/ScoreCalculator');
const RuleRegistry = require('./core/RuleRegistry');
const BaseRule = require('./core/BaseRule');
const { getScoreBand, shouldBlock, getScoreInterpretation } = require('./core/scoreBands');

// Security Rules
const LifecycleScriptRiskRule = require('./rules/LifecycleScriptRiskRule');
const ExternalNetworkCallRule = require('./rules/ExternalNetworkCallRule');
const NpmRegistryClient = require('./api/NpmRegistryClient');
const PackageAnalyzer = require('./utils/packageAnalyzer');
const TarballAnalyzer = require('./utils/tarballAnalyzer');
const config = require('./utils/config');

module.exports = {
  // Core scoring
  ScoreCalculator,
  RuleRegistry,
  BaseRule,
  scoreBands: {
    getScoreBand,
    shouldBlock,
    getScoreInterpretation,
  },
  // API clients
  NpmRegistryClient,
  // Utilities
  PackageAnalyzer,
  TarballAnalyzer,
  config,
  // Security Rules
  LifecycleScriptRiskRule,
  ExternalNetworkCallRule,
  // Version
  version: require('../package.json').version,
};
