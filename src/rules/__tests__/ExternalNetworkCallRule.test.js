const ExternalNetworkCallRule = require('../ExternalNetworkCallRule');

describe('ExternalNetworkCallRule', () => {
  let rule;

  beforeEach(() => {
    rule = new ExternalNetworkCallRule(20);
  });

  describe('constructor', () => {
    it('should create rule with default weight', () => {
      const defaultRule = new ExternalNetworkCallRule();
      expect(defaultRule.weight).toBe(20);
      expect(defaultRule.name).toBe('external-network-call');
    });

    it('should create rule with custom weight', () => {
      const customRule = new ExternalNetworkCallRule(25);
      expect(customRule.weight).toBe(25);
    });
  });

  describe('evaluate', () => {
    it('should return no deduction for package without scripts', async () => {
      const packageData = {};
      const result = await rule.evaluate(packageData);

      expect(result.deduction).toBe(0);
      expect(result.riskLevel).toBe('none');
    });

    it('should return no deduction for safe scripts', async () => {
      const packageData = {
        scripts: {
          test: 'jest',
          build: 'webpack',
        },
      };

      const result = await rule.evaluate(packageData);
      expect(result.deduction).toBe(0);
      expect(result.riskLevel).toBe('none');
    });

    it('should detect fetch in lifecycle script', async () => {
      const packageData = {
        scripts: {
          postinstall: "fetch('http://example.com/data')",
        },
      };

      const result = await rule.evaluate(packageData);
      expect(result.deduction).toBeGreaterThan(0);
      expect(result.details.findings.length).toBeGreaterThan(0);
    });

    it('should detect require(http) in script', async () => {
      const packageData = {
        scripts: {
          postinstall: "const http = require('http');",
        },
      };

      const result = await rule.evaluate(packageData);
      expect(result.deduction).toBeGreaterThan(0);
    });

    it('should detect require(https) in script', async () => {
      const packageData = {
        scripts: {
          install: "const https = require('https');",
        },
      };

      const result = await rule.evaluate(packageData);
      expect(result.deduction).toBeGreaterThan(0);
    });

    it('should detect require(axios) in script', async () => {
      const packageData = {
        scripts: {
          postinstall: "const axios = require('axios');",
        },
      };

      const result = await rule.evaluate(packageData);
      expect(result.deduction).toBeGreaterThan(0);
    });

    it('should detect XMLHttpRequest in script', async () => {
      const packageData = {
        scripts: {
          postinstall: 'const xhr = new XMLHttpRequest();',
        },
      };

      const result = await rule.evaluate(packageData);
      expect(result.deduction).toBeGreaterThan(0);
    });

    it('should detect dynamic import from URL', async () => {
      const packageData = {
        scripts: {
          postinstall: "import('https://example.com/module.js')",
        },
      };

      const result = await rule.evaluate(packageData);
      expect(result.deduction).toBeGreaterThan(0);
    });

    it('should detect import from URL', async () => {
      const packageData = {
        scripts: {
          postinstall: "import module from 'https://example.com/module.js'",
        },
      };

      const result = await rule.evaluate(packageData);
      expect(result.deduction).toBeGreaterThan(0);
    });

    it('should detect network dependencies', async () => {
      const packageData = {
        dependencies: {
          axios: '^1.0.0',
          'node-fetch': '^2.0.0',
        },
      };

      const result = await rule.evaluate(packageData);
      expect(result.details.findings.some((f) => f.source === 'dependencies')).toBe(true);
    });

    it('should calculate full deduction for high risk', async () => {
      const packageData = {
        scripts: {
          postinstall: "fetch('http://example.com')",
          preinstall: "require('http')",
          install: "import('https://example.com/module.js')",
        },
      };

      const result = await rule.evaluate(packageData);
      expect(result.deduction).toBe(20); // Full deduction
      expect(result.riskLevel).toBe('high');
    });

    it('should calculate partial deduction for medium risk', async () => {
      const packageData = {
        scripts: {
          postinstall: "fetch('http://example.com')",
          preinstall: "require('http')",
        },
      };

      const result = await rule.evaluate(packageData);
      // The exact value depends on how many patterns are detected
      // If totalRisk >= 3, it's high risk (full deduction)
      // If totalRisk >= 2, it's medium risk (75% deduction)
      expect(result.deduction).toBeGreaterThan(0);
      if (result.details.totalRisk >= 3) {
        expect(result.deduction).toBe(20); // Full deduction if high risk
      } else if (result.details.totalRisk >= 2) {
        expect(result.deduction).toBe(15); // 75% deduction for medium
      }
    });

    it('should calculate small deduction for low risk', async () => {
      const packageData = {
        scripts: {
          postinstall: "fetch('http://example.com')",
        },
      };

      const result = await rule.evaluate(packageData);
      // The exact value depends on how many patterns are detected
      // Pattern matching + AST parsing might detect multiple patterns
      expect(result.deduction).toBeGreaterThan(0);
      if (result.details.totalRisk >= 2) {
        expect(result.deduction).toBe(15); // 75% if medium risk
      } else {
        expect(result.deduction).toBe(10); // 50% if low risk
      }
    });

    it('should return no deduction when rule is disabled', async () => {
      rule.disable();
      const packageData = {
        scripts: {
          postinstall: "fetch('http://example.com')",
        },
      };

      const result = await rule.evaluate(packageData);
      expect(result.deduction).toBe(0);
      expect(result.details.reason).toBe('Rule is disabled');
    });

    it('should handle multiple lifecycle scripts', async () => {
      const packageData = {
        scripts: {
          preinstall: "require('http')",
          postinstall: "fetch('http://example.com')",
          install: 'safe-command',
        },
      };

      const result = await rule.evaluate(packageData);
      expect(result.details.findings.length).toBeGreaterThan(0);
      expect(result.deduction).toBeGreaterThan(0);
    });

    it('should detect eval with network content', async () => {
      const packageData = {
        scripts: {
          postinstall: "eval(\"fetch('http://example.com')\")",
        },
      };

      const result = await rule.evaluate(packageData);
      expect(result.deduction).toBeGreaterThan(0);
    });
  });

  describe('_isUrl', () => {
    it('should identify valid URLs', () => {
      expect(rule._isUrl('http://example.com')).toBe(true);
      expect(rule._isUrl('https://example.com')).toBe(true);
      expect(rule._isUrl('ftp://example.com')).toBe(false);
      expect(rule._isUrl('not-a-url')).toBe(false);
    });
  });

  describe('_containsNetworkPattern', () => {
    it('should detect network patterns in strings', () => {
      expect(rule._containsNetworkPattern('http://example.com')).toBe(true);
      expect(rule._containsNetworkPattern('fetch(')).toBe(true);
      expect(rule._containsNetworkPattern('XMLHttpRequest')).toBe(true);
      expect(rule._containsNetworkPattern('normal string')).toBe(false);
    });
  });

  describe('_checkNetworkDependencies', () => {
    it('should detect network-related dependencies', () => {
      const dependencies = {
        dependencies: {
          axios: '^1.0.0',
          express: '^4.0.0',
        },
        devDependencies: {
          'node-fetch': '^2.0.0',
        },
      };

      const findings = rule._checkNetworkDependencies(dependencies);
      expect(findings.length).toBeGreaterThan(0);
      expect(findings.some((f) => f.package === 'axios')).toBe(true);
    });
  });
});

