/**
 * Tests for NpmRegistryClient
 */

const NpmRegistryClient = require('../NpmRegistryClient');
const https = require('https');
const http = require('http');

// Mock https and http
jest.mock('https');
jest.mock('http');

describe('NpmRegistryClient', () => {
  let client;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new NpmRegistryClient();
  });

  describe('constructor', () => {
    it('should create client with default config', () => {
      expect(client.registry).toBe('https://registry.npmjs.org');
      expect(client.timeout).toBe(30000);
    });

    it('should accept custom config', () => {
      const custom = new NpmRegistryClient({
        registry: 'https://custom.registry.com',
        timeout: 60000,
      });
      expect(custom.registry).toBe('https://custom.registry.com');
      expect(custom.timeout).toBe(60000);
    });
  });

  describe('getPackageMetadata', () => {
    it('should throw error if package name is missing', async () => {
      await expect(client.getPackageMetadata(null)).rejects.toThrow('Package name is required');
      await expect(client.getPackageMetadata('')).rejects.toThrow('Package name is required');
    });

    it('should fetch package metadata for latest version', async () => {
      const mockData = {
        name: 'test-package',
        'dist-tags': {
          latest: '1.0.0',
        },
        versions: {
          '1.0.0': {
            version: '1.0.0',
            dist: {
              tarball: 'https://registry.npmjs.org/test-package/-/test-package-1.0.0.tgz',
            },
          },
        },
      };

      const mockResponse = {
        statusCode: 200,
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(JSON.stringify(mockData));
          } else if (event === 'end') {
            setTimeout(() => callback(), 0);
          }
        }),
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

      const result = await client.getPackageMetadata('test-package');

      expect(result).toHaveProperty('version', '1.0.0');
      expect(result).toHaveProperty('name', 'test-package');
      expect(https.get).toHaveBeenCalledWith(
        'https://registry.npmjs.org/test-package',
        expect.any(Function)
      );
    });

    it('should fetch package metadata for specific version', async () => {
      const mockData = {
        name: 'test-package',
        versions: {
          '1.0.0': {
            version: '1.0.0',
            dist: {
              tarball: 'https://registry.npmjs.org/test-package/-/test-package-1.0.0.tgz',
            },
          },
        },
      };

      const mockResponse = {
        statusCode: 200,
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(JSON.stringify(mockData));
          } else if (event === 'end') {
            setTimeout(() => callback(), 0);
          }
        }),
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

      const result = await client.getPackageMetadata('test-package', '1.0.0');

      expect(result).toHaveProperty('version', '1.0.0');
      expect(https.get).toHaveBeenCalledWith(
        'https://registry.npmjs.org/test-package/1.0.0',
        expect.any(Function)
      );
    });

    it('should handle 404 errors', async () => {
      const mockResponse = {
        statusCode: 404,
        statusMessage: 'Not Found',
        on: jest.fn((event, callback) => {
          if (event === 'end') {
            setTimeout(() => callback(), 0);
          }
        }),
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

      await expect(client.getPackageMetadata('nonexistent-package')).rejects.toThrow(
        'Package "nonexistent-package" not found'
      );
    });

    it('should handle network errors', async () => {
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

      await expect(client.getPackageMetadata('test-package')).rejects.toThrow('Network error');
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

      await expect(client.getPackageMetadata('test-package')).rejects.toThrow('Request timeout');
    });

    it('should handle invalid JSON response', async () => {
      const mockResponse = {
        statusCode: 200,
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback('invalid json');
          } else if (event === 'end') {
            setTimeout(() => callback(), 0);
          }
        }),
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

      await expect(client.getPackageMetadata('test-package')).rejects.toThrow(
        'Failed to parse JSON'
      );
    });
  });

  describe('getAllVersions', () => {
    it('should throw error if package name is missing', async () => {
      await expect(client.getAllVersions(null)).rejects.toThrow('Package name is required');
    });

    it('should fetch all versions', async () => {
      const mockData = {
        name: 'test-package',
        versions: {
          '1.0.0': { version: '1.0.0' },
          '2.0.0': { version: '2.0.0' },
        },
      };

      const mockResponse = {
        statusCode: 200,
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(JSON.stringify(mockData));
          } else if (event === 'end') {
            setTimeout(() => callback(), 0);
          }
        }),
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

      const result = await client.getAllVersions('test-package');

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      // The method returns data.versions which should be an object
      expect(result['1.0.0']).toBeDefined();
      expect(result['2.0.0']).toBeDefined();
    });

    it('should handle 404 errors', async () => {
      const mockResponse = {
        statusCode: 404,
        statusMessage: 'Not Found',
        on: jest.fn((event, callback) => {
          if (event === 'end') {
            setTimeout(() => callback(), 0);
          }
        }),
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

      await expect(client.getAllVersions('nonexistent-package')).rejects.toThrow(
        'Package "nonexistent-package" not found'
      );
    });
  });

  describe('getTarballUrl', () => {
    it('should get tarball URL from metadata', async () => {
      const mockData = {
        name: 'test-package',
        'dist-tags': {
          latest: '1.0.0',
        },
        versions: {
          '1.0.0': {
            version: '1.0.0',
            dist: {
              tarball: 'https://registry.npmjs.org/test-package/-/test-package-1.0.0.tgz',
            },
          },
        },
      };

      const mockResponse = {
        statusCode: 200,
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(JSON.stringify(mockData));
          } else if (event === 'end') {
            setTimeout(() => callback(), 0);
          }
        }),
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

      const url = await client.getTarballUrl('test-package', '1.0.0');

      expect(url).toBe('https://registry.npmjs.org/test-package/-/test-package-1.0.0.tgz');
    });

    it('should return null if tarball URL is missing', async () => {
      const mockData = {
        name: 'test-package',
        'dist-tags': {
          latest: '1.0.0',
        },
        versions: {
          '1.0.0': {
            version: '1.0.0',
            dist: {},
          },
        },
      };

      const mockResponse = {
        statusCode: 200,
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback(JSON.stringify(mockData));
          } else if (event === 'end') {
            setTimeout(() => callback(), 0);
          }
        }),
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

      const url = await client.getTarballUrl('test-package', '1.0.0');

      expect(url).toBeNull();
    });
  });

  describe('_normalizeMetadata', () => {
    it('should normalize metadata with version', () => {
      const data = {
        versions: {
          '1.0.0': {
            version: '1.0.0',
            dist: { tarball: 'http://example.com/tarball.tgz' },
          },
        },
      };

      const result = client._normalizeMetadata(data, 'test-package', '1.0.0');

      expect(result).toHaveProperty('version', '1.0.0');
      expect(result).toHaveProperty('name', 'test-package');
    });

    it('should normalize metadata with latest dist-tag', () => {
      const data = {
        'dist-tags': {
          latest: '1.0.0',
        },
        versions: {
          '1.0.0': {
            version: '1.0.0',
            dist: { tarball: 'http://example.com/tarball.tgz' },
          },
        },
      };

      const result = client._normalizeMetadata(data, 'test-package');

      expect(result).toHaveProperty('version', '1.0.0');
      expect(result).toHaveProperty('name', 'test-package');
    });

    it('should return data as-is if no version or dist-tag', () => {
      const data = {
        name: 'test-package',
      };

      const result = client._normalizeMetadata(data, 'test-package');

      expect(result).toEqual(data);
    });
  });

  describe('_fetch', () => {
    it('should use https for https URLs', async () => {
      const mockResponse = {
        statusCode: 200,
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback('{}');
          } else if (event === 'end') {
            setTimeout(() => callback(), 0);
          }
        }),
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

      await client._fetch('https://example.com/api');

      expect(https.get).toHaveBeenCalled();
      expect(http.get).not.toHaveBeenCalled();
    });

    it('should use http for http URLs', async () => {
      const mockResponse = {
        statusCode: 200,
        on: jest.fn((event, callback) => {
          if (event === 'data') {
            callback('{}');
          } else if (event === 'end') {
            setTimeout(() => callback(), 0);
          }
        }),
      };

      const mockRequest = {
        on: jest.fn().mockReturnThis(),
        setTimeout: jest.fn().mockReturnThis(),
        destroy: jest.fn(),
      };

      http.get.mockImplementation((url, callback) => {
        callback(mockResponse);
        return mockRequest;
      });

      await client._fetch('http://example.com/api');

      expect(http.get).toHaveBeenCalled();
    });

    it('should handle HTTP error status codes', async () => {
      const mockResponse = {
        statusCode: 500,
        statusMessage: 'Internal Server Error',
        on: jest.fn((event, callback) => {
          if (event === 'end') {
            setTimeout(() => callback(), 0);
          }
        }),
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

      await expect(client._fetch('https://example.com/api')).rejects.toThrow('HTTP 500');
    });
  });
});
