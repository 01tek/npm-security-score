const ScoreCalculator = require('../ScoreCalculator');

describe('ScoreCalculator', () => {
  let calculator;

  beforeEach(() => {
    calculator = new ScoreCalculator();
  });

  describe('constructor', () => {
    it('should create calculator with default config', () => {
      expect(calculator.config.baseScore).toBe(100);
      expect(calculator.config.minScore).toBe(0);
      expect(calculator.config.maxScore).toBe(100);
    });

    it('should accept custom config', () => {
      const custom = new ScoreCalculator({ baseScore: 50 });
      expect(custom.config.baseScore).toBe(50);
    });
  });

  describe('registerRule', () => {
    it('should register a rule', () => {
      const rule = {
        name: 'test-rule',
        evaluate: jest.fn().mockResolvedValue({ deduction: 0 }),
      };

      calculator.registerRule(rule);
      expect(calculator.getRules()).toContain(rule);
    });
  });

  describe('calculateScore', () => {
    it('should throw error if packageData is missing', async () => {
      await expect(calculator.calculateScore(null)).rejects.toThrow(
        'Package data is required'
      );
    });

    it('should return base score when no rules are registered', async () => {
      const result = await calculator.calculateScore({
        name: 'test-package',
        version: '1.0.0',
      });

      expect(result.score).toBe(100);
      expect(result.band).toBeDefined();
      expect(result.packageName).toBe('test-package');
    });

    it('should calculate score with rules', async () => {
      const rule1 = {
        name: 'rule1',
        evaluate: jest.fn().mockResolvedValue({ deduction: 10 }),
      };
      const rule2 = {
        name: 'rule2',
        evaluate: jest.fn().mockResolvedValue({ deduction: 5 }),
      };

      calculator.registerRule(rule1);
      calculator.registerRule(rule2);

      const result = await calculator.calculateScore({
        name: 'test-package',
        version: '1.0.0',
      });

      expect(result.score).toBe(85); // 100 - 10 - 5
      expect(result.ruleResults).toHaveLength(2);
    });

    it('should not go below minScore', async () => {
      const calculator = new ScoreCalculator({ minScore: 50 });
      const rule = {
        name: 'big-deduction',
        evaluate: jest.fn().mockResolvedValue({ deduction: 100 }),
      };

      calculator.registerRule(rule);
      const result = await calculator.calculateScore({
        name: 'test-package',
        version: '1.0.0',
      });

      expect(result.score).toBe(50);
    });

    it('should not go above maxScore', async () => {
      const calculator = new ScoreCalculator({ baseScore: 150, maxScore: 100 });
      const result = await calculator.calculateScore({
        name: 'test-package',
        version: '1.0.0',
      });

      expect(result.score).toBe(100);
    });

    it('should handle rule evaluation errors gracefully', async () => {
      const rule = {
        name: 'error-rule',
        evaluate: jest.fn().mockRejectedValue(new Error('Rule error')),
      };

      calculator.registerRule(rule);
      const result = await calculator.calculateScore({
        name: 'test-package',
        version: '1.0.0',
      });

      expect(result.score).toBe(100); // No deduction on error
      expect(result.ruleResults[0].riskLevel).toBe('error');
    });
  });
});

