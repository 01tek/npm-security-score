const PackageAnalyzer = require('../packageAnalyzer');

describe('PackageAnalyzer', () => {
  describe('extractLifecycleScripts', () => {
    it('should extract lifecycle scripts', () => {
      const packageJson = {
        scripts: {
          preinstall: 'echo preinstall',
          postinstall: 'echo postinstall',
          test: 'jest',
        },
      };

      const scripts = PackageAnalyzer.extractLifecycleScripts(packageJson);
      expect(scripts.preinstall).toBe('echo preinstall');
      expect(scripts.postinstall).toBe('echo postinstall');
      expect(scripts.test).toBeUndefined();
    });

    it('should return empty object for package without scripts', () => {
      const packageJson = {};
      const scripts = PackageAnalyzer.extractLifecycleScripts(packageJson);
      expect(scripts).toEqual({});
    });

    it('should handle null/undefined packageJson', () => {
      expect(PackageAnalyzer.extractLifecycleScripts(null)).toEqual({});
      expect(PackageAnalyzer.extractLifecycleScripts(undefined)).toEqual({});
    });
  });

  describe('normalizeScript', () => {
    it('should normalize script content', () => {
      expect(PackageAnalyzer.normalizeScript('  echo hello  ')).toBe('echo hello');
      expect(PackageAnalyzer.normalizeScript('echo   hello   world')).toBe('echo hello world');
    });

    it('should handle non-string input', () => {
      expect(PackageAnalyzer.normalizeScript(null)).toBe('');
      expect(PackageAnalyzer.normalizeScript(123)).toBe('');
    });
  });

  describe('extractAllScripts', () => {
    it('should extract all scripts', () => {
      const packageJson = {
        scripts: {
          test: 'jest',
          build: 'webpack',
        },
      };

      const scripts = PackageAnalyzer.extractAllScripts(packageJson);
      expect(scripts).toEqual(packageJson.scripts);
    });
  });

  describe('calculateSizeMetrics', () => {
    it('should calculate size metrics', () => {
      const packageData = {
        dist: {
          unpackedSize: 1024,
          size: 512,
          fileCount: 10,
        },
      };

      const metrics = PackageAnalyzer.calculateSizeMetrics(packageData);
      expect(metrics.unpackedSize).toBe(1024);
      expect(metrics.tarballSize).toBe(512);
      expect(metrics.fileCount).toBe(10);
    });

    it('should handle missing dist data', () => {
      const metrics = PackageAnalyzer.calculateSizeMetrics({});
      expect(metrics.unpackedSize).toBe(0);
      expect(metrics.tarballSize).toBe(0);
      expect(metrics.fileCount).toBe(0);
    });
  });

  describe('getPackageSummary', () => {
    it('should create package summary', () => {
      const packageData = {
        name: 'test-package',
        version: '1.0.0',
        description: 'Test package',
        scripts: {
          test: 'jest',
          postinstall: 'echo done',
        },
        dist: {
          unpackedSize: 1024,
        },
      };

      const summary = PackageAnalyzer.getPackageSummary(packageData);
      expect(summary.name).toBe('test-package');
      expect(summary.version).toBe('1.0.0');
      expect(summary.hasScripts).toBe(true);
      expect(summary.hasLifecycleScripts).toBe(true);
      expect(summary.lifecycleScripts.postinstall).toBe('echo done');
    });
  });
});
