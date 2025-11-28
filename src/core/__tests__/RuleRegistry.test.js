const RuleRegistry = require('../RuleRegistry');

describe('RuleRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = new RuleRegistry();
  });

  describe('register', () => {
    it('should register a valid rule', () => {
      const rule = {
        name: 'test-rule',
        evaluate: jest.fn(),
      };

      registry.register(rule);
      expect(registry.has('test-rule')).toBe(true);
    });

    it('should throw error for invalid rule', () => {
      expect(() => registry.register(null)).toThrow('Rule must be an object');
      expect(() => registry.register({})).toThrow('Rule must have a name property');
      expect(() => registry.register({ name: 'test' })).toThrow(
        'Rule must have an evaluate function'
      );
    });

    it('should throw error for duplicate rule name', () => {
      const rule = {
        name: 'test-rule',
        evaluate: jest.fn(),
      };

      registry.register(rule);
      expect(() => registry.register(rule)).toThrow(
        'Rule with name "test-rule" is already registered'
      );
    });
  });

  describe('unregister', () => {
    it('should unregister a rule', () => {
      const rule = {
        name: 'test-rule',
        evaluate: jest.fn(),
      };

      registry.register(rule);
      expect(registry.has('test-rule')).toBe(true);

      registry.unregister('test-rule');
      expect(registry.has('test-rule')).toBe(false);
    });
  });

  describe('get', () => {
    it('should get a registered rule', () => {
      const rule = {
        name: 'test-rule',
        evaluate: jest.fn(),
      };

      registry.register(rule);
      expect(registry.get('test-rule')).toBe(rule);
    });

    it('should return undefined for non-existent rule', () => {
      expect(registry.get('non-existent')).toBeUndefined();
    });
  });

  describe('getActiveRules', () => {
    it('should return all registered rules', () => {
      const rule1 = { name: 'rule1', evaluate: jest.fn() };
      const rule2 = { name: 'rule2', evaluate: jest.fn() };

      registry.register(rule1);
      registry.register(rule2);

      const rules = registry.getActiveRules();
      expect(rules).toHaveLength(2);
      expect(rules).toContain(rule1);
      expect(rules).toContain(rule2);
    });

    it('should return empty array when no rules registered', () => {
      expect(registry.getActiveRules()).toEqual([]);
    });
  });

  describe('size', () => {
    it('should return number of registered rules', () => {
      expect(registry.size()).toBe(0);

      registry.register({ name: 'rule1', evaluate: jest.fn() });
      expect(registry.size()).toBe(1);

      registry.register({ name: 'rule2', evaluate: jest.fn() });
      expect(registry.size()).toBe(2);
    });
  });

  describe('clear', () => {
    it('should clear all rules', () => {
      registry.register({ name: 'rule1', evaluate: jest.fn() });
      registry.register({ name: 'rule2', evaluate: jest.fn() });

      expect(registry.size()).toBe(2);

      registry.clear();
      expect(registry.size()).toBe(0);
      expect(registry.getActiveRules()).toEqual([]);
    });
  });
});
