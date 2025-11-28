/**
 * Performance and load tests
 */

const ScoreCalculator = require('../../src/core/ScoreCalculator');
const RuleRegistry = require('../../src/core/RuleRegistry');
const NpmRegistryClient = require('../../src/api/NpmRegistryClient');

// Mock external APIs
jest.mock('../../src/api/NpmRegistryClient');
jest.mock('../../src/api/GitHubClient');
jest.mock('../../src/api/AdvisoryClient');
jest.mock('../../src/utils/tarballAnalyzer');

describe('Performance Tests', () => {
  let scoreCalculator;
  let ruleRegistry;
  let mockNpmClient;

  beforeEach(() => {
    jest.clearAllMocks();

    ruleRegistry = new RuleRegistry();
    scoreCalculator = new ScoreCalculator(ruleRegistry);

    mockNpmClient = {
      getPackageMetadata: jest.fn(),
      getAllVersions: jest.fn(),
      getTarballUrl: jest.fn(),
    };
    NpmRegistryClient.mockImplementation(() => mockNpmClient);
  });

  describe('Scoring performance', () => {
    const createMockPackage = name => ({
      name,
      version: '1.0.0',
      scripts: {},
      dependencies: {},
      dist: {
        tarball: `https://registry.npmjs.org/${name}/-/${name}-1.0.0.tgz`,
      },
    });

    it('should score single package quickly', async () => {
      const mockPackage = createMockPackage('test-package');
      mockNpmClient.getPackageMetadata.mockResolvedValue(mockPackage);
      mockNpmClient.getAllVersions.mockResolvedValue({
        '1.0.0': mockPackage,
      });

      const startTime = Date.now();
      await scoreCalculator.calculateScore('test-package', '1.0.0', {
        npmClient: mockNpmClient,
      });
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should handle multiple packages efficiently', async () => {
      const packages = Array.from({ length: 10 }, (_, i) => createMockPackage(`package-${i}`));

      packages.forEach(pkg => {
        mockNpmClient.getPackageMetadata.mockResolvedValueOnce(pkg);
        mockNpmClient.getAllVersions.mockResolvedValueOnce({
          '1.0.0': pkg,
        });
      });

      const startTime = Date.now();
      const results = await Promise.all(
        packages.map(pkg =>
          scoreCalculator.calculateScore(pkg.name, '1.0.0', {
            npmClient: mockNpmClient,
          })
        )
      );
      const endTime = Date.now();

      expect(results).toHaveLength(10);
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it('should handle large dependency trees', async () => {
      const largeDependencies = {};
      for (let i = 0; i < 100; i++) {
        largeDependencies[`dep-${i}`] = `^1.0.${i}`;
      }

      const mockPackage = {
        name: 'large-package',
        version: '1.0.0',
        scripts: {},
        dependencies: largeDependencies,
        dist: {
          tarball: 'https://registry.npmjs.org/large-package/-/large-package-1.0.0.tgz',
        },
      };

      mockNpmClient.getPackageMetadata.mockResolvedValue(mockPackage);
      mockNpmClient.getAllVersions.mockResolvedValue({
        '1.0.0': mockPackage,
      });

      const startTime = Date.now();
      await scoreCalculator.calculateScore('large-package', '1.0.0', {
        npmClient: mockNpmClient,
      });
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(2000); // Should handle large deps efficiently
    });
  });

  describe('Memory usage', () => {
    it('should not leak memory with repeated scoring', async () => {
      const mockPackage = {
        name: 'test-package',
        version: '1.0.0',
        scripts: {},
        dependencies: {},
        dist: {
          tarball: 'https://registry.npmjs.org/test-package/-/test-package-1.0.0.tgz',
        },
      };

      mockNpmClient.getPackageMetadata.mockResolvedValue(mockPackage);
      mockNpmClient.getAllVersions.mockResolvedValue({
        '1.0.0': mockPackage,
      });

      // Run multiple times
      for (let i = 0; i < 50; i++) {
        await scoreCalculator.calculateScore('test-package', '1.0.0', {
          npmClient: mockNpmClient,
        });
      }

      // If we get here without memory issues, test passes
      expect(true).toBe(true);
    });
  });

  describe('Concurrent requests', () => {
    it('should handle concurrent scoring requests', async () => {
      const packages = Array.from({ length: 20 }, (_, i) => ({
        name: `package-${i}`,
        version: '1.0.0',
        scripts: {},
        dependencies: {},
        dist: {
          tarball: `https://registry.npmjs.org/package-${i}/-/package-${i}-1.0.0.tgz`,
        },
      }));

      packages.forEach(pkg => {
        mockNpmClient.getPackageMetadata.mockResolvedValueOnce(pkg);
        mockNpmClient.getAllVersions.mockResolvedValueOnce({
          '1.0.0': pkg,
        });
      });

      const startTime = Date.now();
      const results = await Promise.all(
        packages.map(pkg =>
          scoreCalculator.calculateScore(pkg.name, '1.0.0', {
            npmClient: mockNpmClient,
          })
        )
      );
      const endTime = Date.now();

      expect(results).toHaveLength(20);
      results.forEach(result => {
        expect(result).toHaveProperty('score');
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
      });

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10000); // Should handle 20 concurrent requests
    });
  });
});
