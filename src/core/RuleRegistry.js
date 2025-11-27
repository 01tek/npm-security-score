/**
 * Registry for security rules
 * Manages registration and retrieval of security scoring rules
 */

class RuleRegistry {
  constructor() {
    this.rules = new Map();
  }

  /**
   * Register a security rule
   * @param {SecurityRule} rule - The security rule to register
   * @throws {Error} If rule is invalid or already registered
   */
  register(rule) {
    if (!rule || typeof rule !== 'object') {
      throw new Error('Rule must be an object');
    }

    if (!rule.name || typeof rule.name !== 'string') {
      throw new Error('Rule must have a name property');
    }

    if (typeof rule.evaluate !== 'function') {
      throw new Error('Rule must have an evaluate function');
    }

    if (this.rules.has(rule.name)) {
      throw new Error(`Rule with name "${rule.name}" is already registered`);
    }

    this.rules.set(rule.name, rule);
  }

  /**
   * Unregister a rule
   * @param {string} ruleName - Name of the rule to unregister
   */
  unregister(ruleName) {
    this.rules.delete(ruleName);
  }

  /**
   * Get a rule by name
   * @param {string} ruleName - Name of the rule
   * @returns {SecurityRule|undefined} The rule or undefined if not found
   */
  get(ruleName) {
    return this.rules.get(ruleName);
  }

  /**
   * Get all active rules
   * @returns {Array<SecurityRule>} Array of all registered rules
   */
  getActiveRules() {
    return Array.from(this.rules.values());
  }

  /**
   * Check if a rule is registered
   * @param {string} ruleName - Name of the rule
   * @returns {boolean} True if rule is registered
   */
  has(ruleName) {
    return this.rules.has(ruleName);
  }

  /**
   * Clear all rules
   */
  clear() {
    this.rules.clear();
  }

  /**
   * Get number of registered rules
   * @returns {number} Number of registered rules
   */
  size() {
    return this.rules.size;
  }
}

module.exports = RuleRegistry;

