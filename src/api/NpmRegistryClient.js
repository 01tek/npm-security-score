/**
 * npm Registry API client
 * Fetches package metadata from npm registry
 */

const https = require('https');
const http = require('http');

class NpmRegistryClient {
  constructor(config = {}) {
    this.registry = config.registry || 'https://registry.npmjs.org';
    this.timeout = config.timeout || 30000;
  }

  /**
   * Fetch package metadata
   * @param {string} packageName - Name of the package
   * @param {string} version - Optional specific version (default: latest)
   * @returns {Promise<Object>} Package metadata
   */
  async getPackageMetadata(packageName, version = null) {
    if (!packageName) {
      throw new Error('Package name is required');
    }

    const url = version
      ? `${this.registry}/${packageName}/${version}`
      : `${this.registry}/${packageName}`;

    try {
      const data = await this._fetch(url);
      return this._normalizeMetadata(data, packageName, version);
    } catch (error) {
      if (error.statusCode === 404) {
        throw new Error(`Package "${packageName}" not found`);
      }
      throw new Error(`Failed to fetch package metadata: ${error.message}`);
    }
  }

  /**
   * Fetch all versions of a package
   * @param {string} packageName - Name of the package
   * @returns {Promise<Object>} All versions metadata
   */
  async getAllVersions(packageName) {
    if (!packageName) {
      throw new Error('Package name is required');
    }

    const url = `${this.registry}/${packageName}`;

    try {
      const data = await this._fetch(url);
      return data.versions || {};
    } catch (error) {
      if (error.statusCode === 404) {
        throw new Error(`Package "${packageName}" not found`);
      }
      throw new Error(`Failed to fetch versions: ${error.message}`);
    }
  }

  /**
   * Fetch package tarball URL
   * @param {string} packageName - Name of the package
   * @param {string} version - Package version
   * @returns {Promise<string>} Tarball URL
   */
  async getTarballUrl(packageName, version) {
    const metadata = await this.getPackageMetadata(packageName, version);
    return metadata.dist?.tarball || null;
  }

  /**
   * Normalize package metadata
   * @private
   */
  _normalizeMetadata(data, packageName, version) {
    if (version && data.versions && data.versions[version]) {
      return {
        ...data.versions[version],
        name: packageName,
        version,
        dist: data.versions[version].dist,
      };
    }

    if (data['dist-tags'] && data['dist-tags'].latest) {
      const latestVersion = data['dist-tags'].latest;
      const latestData = data.versions[latestVersion];
      return {
        ...latestData,
        name: packageName,
        version: latestVersion,
        dist: latestData.dist,
      };
    }

    return data;
  }

  /**
   * Fetch data from URL
   * @private
   */
  _fetch(url) {
    return new Promise((resolve, reject) => {
      const isHttps = url.startsWith('https');
      const client = isHttps ? https : http;

      const request = client.get(url, (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          if (response.statusCode >= 200 && response.statusCode < 300) {
            try {
              const parsed = JSON.parse(data);
              resolve(parsed);
            } catch (error) {
              reject(new Error(`Failed to parse JSON: ${error.message}`));
            }
          } else {
            const error = new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`);
            error.statusCode = response.statusCode;
            reject(error);
          }
        });
      });

      request.on('error', (error) => {
        reject(error);
      });

      request.setTimeout(this.timeout, () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }
}

module.exports = NpmRegistryClient;

