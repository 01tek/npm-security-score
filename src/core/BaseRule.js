/**
 * Base class for security rules
 * All security rules should extend this class
 */

class BaseRule {
  constructor(name, weight = 0, description = '') {
    if (!name || typeof name !== 'string') {
      throw new Error('Rule name is required');
    }

    this.name = name;
    this.weight = weight;
    this.description = description;
    this.enabled = true;
  }

  /**
   * Evaluate the rule against package data
   * Must be implemented by subclasses
   * @param {PackageMetadata} _packageData - Package metadata
   * @returns {Promise<RuleResult>} Evaluation result
   */
  async evaluate(_packageData) {
    throw new Error('evaluate() must be implemented by subclass');
  }

  /**
   * Enable the rule
   */
  enable() {
    this.enabled = true;
  }

  /**
   * Disable the rule
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Check if rule is enabled
   * @returns {boolean} True if enabled
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Get rule metadata
   * @returns {Object} Rule metadata
   */
  getMetadata() {
    return {
      name: this.name,
      weight: this.weight,
      description: this.description,
      enabled: this.enabled,
    };
  }
}

module.exports = BaseRule;

