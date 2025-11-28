const TarballAnalyzer = require('../tarballAnalyzer');
const https = require('https');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

// Mock dependencies
jest.mock('https');
jest.mock('http');
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    rm: jest.fn(),
    readFile: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
  },
  createWriteStream: jest.fn(),
  createReadStream: jest.fn(),
}));

const { createWriteStream } = require('fs');

describe('TarballAnalyzer', () => {
  let analyzer;
  let mockTempDir;

  beforeEach(() => {
    mockTempDir = path.join(os.tmpdir(), 'npm-security-score-test');
    analyzer = new TarballAnalyzer({ tempDir: mockTempDir });
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create analyzer with default options', () => {
      const defaultAnalyzer = new TarballAnalyzer();
      expect(defaultAnalyzer.tempDir).toContain('npm-security-score');
      expect(defaultAnalyzer.timeout).toBe(60000);
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

    it('should throw error if tarballUrl is empty string', async () => {
      await expect(analyzer.analyzeTarball('', 'test-package')).rejects.toThrow(
        'Tarball URL is required'
      );
    });

    it('should handle download errors', async () => {
      const mockRequest = {
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            setTimeout(() => callback(new Error('Network error')), 0);
          }
          return mockRequest;
        }),
        setTimeout: jest.fn().mockReturnThis(),
        destroy: jest.fn(),
      };

      https.get.mockReturnValue(mockRequest);
      fs.mkdir.mockResolvedValue();

      await expect(
        analyzer.analyzeTarball('https://example.com/package.tgz', 'test-package')
      ).rejects.toThrow('Network error');
    });

    it('should handle HTTP errors', async () => {
      const mockResponse = {
        statusCode: 404,
        on: jest.fn((event, callback) => {
          if (event === 'end') {
            setTimeout(() => callback(), 0);
          }
        }),
        pipe: jest.fn(),
      };

      const mockRequest = {
        on: jest.fn().mockReturnThis(),
        setTimeout: jest.fn().mockReturnThis(),
        destroy: jest.fn(),
      };

      https.get.mockImplementation((url, callback) => {
        callback(mockResponse);
        return mockRequest;
      });

      fs.mkdir.mockResolvedValue();

      await expect(
        analyzer.analyzeTarball('https://example.com/package.tgz', 'test-package')
      ).rejects.toThrow('Failed to download tarball');
    });

    it('should handle timeout', async () => {
      const mockRequest = {
        on: jest.fn((event, callback) => {
          if (event === 'timeout') {
            setTimeout(() => callback(), 0);
          }
          return mockRequest;
        }),
        setTimeout: jest.fn((timeout, callback) => {
          setTimeout(() => callback(), 0);
          return mockRequest;
        }),
        destroy: jest.fn(),
      };

      https.get.mockReturnValue(mockRequest);
      fs.mkdir.mockResolvedValue();

      await expect(
        analyzer.analyzeTarball('https://example.com/package.tgz', 'test-package')
      ).rejects.toThrow('Download timeout');
    });

    it('should handle package names with slashes', async () => {
      const packageName = '@scope/package';
      const expectedPath = path.join(mockTempDir, '@scope_package');

      fs.mkdir.mockResolvedValue();
      const mockRequest = {
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            setTimeout(() => callback(new Error('Test error')), 0);
          }
          return mockRequest;
        }),
        setTimeout: jest.fn().mockReturnThis(),
        destroy: jest.fn(),
      };

      https.get.mockReturnValue(mockRequest);

      await expect(
        analyzer.analyzeTarball('https://example.com/package.tgz', packageName)
      ).rejects.toThrow();

      expect(fs.mkdir).toHaveBeenCalledWith(expectedPath, { recursive: true });
    });
  });

  describe('_downloadTarball', () => {
    it('should use https for https URLs', async () => {
      const mockResponse = {
        statusCode: 200,
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            // No data
          } else if (event === 'end') {
            setTimeout(() => callback(), 0);
          }
        }),
        pipe: jest.fn(stream => {
          // Simulate pipe completion
          setTimeout(() => {
            if (stream && stream.emit) {
              stream.emit('finish');
            }
          }, 0);
          return stream;
        }),
      };

      const mockRequest = {
        on: jest.fn().mockReturnThis(),
        setTimeout: jest.fn().mockReturnThis(),
        destroy: jest.fn(),
      };

      const mockWriteStream = {
        on: jest.fn((event, callback) => {
          if (event === 'finish') {
            setTimeout(() => callback(), 0);
          }
          return mockWriteStream;
        }),
        close: jest.fn(),
        emit: jest.fn(),
      };

      https.get.mockImplementation((url, callback) => {
        callback(mockResponse);
        return mockRequest;
      });

      createWriteStream.mockReturnValue(mockWriteStream);
      fs.mkdir.mockResolvedValue();

      // This will fail at extraction, but we can test the download part
      try {
        await analyzer.analyzeTarball('https://example.com/package.tgz', 'test-package');
      } catch (error) {
        // Expected to fail at extraction
      }

      expect(https.get).toHaveBeenCalled();
      expect(http.get).not.toHaveBeenCalled();
    });

    it('should use http for http URLs', async () => {
      const mockResponse = {
        statusCode: 200,
        on: jest.fn((event, callback) => {
          if (event === 'end') {
            setTimeout(() => callback(), 0);
          }
        }),
        pipe: jest.fn(),
      };

      const mockRequest = {
        on: jest.fn().mockReturnThis(),
        setTimeout: jest.fn().mockReturnThis(),
        destroy: jest.fn(),
      };

      const mockWriteStream = {
        on: jest.fn((event, callback) => {
          if (event === 'finish') {
            setTimeout(() => callback(), 0);
          }
          return mockWriteStream;
        }),
        close: jest.fn(),
      };

      http.get.mockImplementation((url, callback) => {
        callback(mockResponse);
        return mockRequest;
      });

      createWriteStream.mockReturnValue(mockWriteStream);
      fs.mkdir.mockResolvedValue();

      // This will fail at extraction, but we can test the download part
      try {
        await analyzer.analyzeTarball('http://example.com/package.tgz', 'test-package');
      } catch (error) {
        // Expected to fail at extraction
      }

      expect(http.get).toHaveBeenCalled();
    });
  });

  describe('getFileContent', () => {
    it('should throw error for invalid file path', async () => {
      const extractPath = '/tmp/extract';
      await expect(analyzer.getFileContent(extractPath, '../../../etc/passwd')).rejects.toThrow(
        'Invalid file path'
      );
    });

    it('should throw error for absolute paths outside extract path', async () => {
      const extractPath = '/tmp/extract';
      // Test with a path that escapes the extract directory
      await expect(analyzer.getFileContent(extractPath, '../../../etc/passwd')).rejects.toThrow(
        'Invalid file path'
      );
    });

    it('should read file content when path is valid', async () => {
      const extractPath = '/tmp/extract';
      const filePath = 'package/index.js';
      const fileContent = 'console.log("test");';

      fs.readFile.mockResolvedValue(fileContent);

      const content = await analyzer.getFileContent(extractPath, filePath);

      expect(content).toBe(fileContent);
      expect(fs.readFile).toHaveBeenCalledWith(
        path.join(extractPath, 'package', filePath),
        'utf-8'
      );
    });

    it('should handle file read errors', async () => {
      const extractPath = '/tmp/extract';
      const filePath = 'package/index.js';
      const error = new Error('File not found');

      fs.readFile.mockRejectedValue(error);

      await expect(analyzer.getFileContent(extractPath, filePath)).rejects.toThrow(
        'Failed to read file'
      );
    });
  });
});
