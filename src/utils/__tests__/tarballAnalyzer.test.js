const TarballAnalyzer = require('../tarballAnalyzer');

describe('TarballAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new TarballAnalyzer();
  });

  describe('constructor', () => {
    it('should create analyzer with default options', () => {
      expect(analyzer.tempDir).toContain('npm-security-score');
      expect(analyzer.timeout).toBe(60000);
    });

    it('should accept custom options', () => {
      const custom = new TarballAnalyzer({
        tempDir: '/custom/temp',
        timeout: 30000,
      });
      expect(custom.tempDir).toBe('/custom/temp');
      expect(custom.timeout).toBe(30000);
    });
  });

  describe('analyzeTarball', () => {
    it('should throw error if tarballUrl is missing', async () => {
      await expect(analyzer.analyzeTarball(null, 'test-package')).rejects.toThrow(
        'Tarball URL is required'
      );
    });

    // Note: Integration tests with real tarballs would require network access
    // These would be better as integration tests
  });

  describe('getFileContent', () => {
    it('should throw error for invalid file path', async () => {
      const extractPath = '/tmp/extract';
      await expect(
        analyzer.getFileContent(extractPath, '../../../etc/passwd')
      ).rejects.toThrow('Invalid file path');
    });
  });
});

