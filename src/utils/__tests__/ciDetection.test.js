const CIDetection = require('../ciDetection');

describe('CIDetection', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isCI', () => {
    it('should detect GitHub Actions', () => {
      process.env = { ...originalEnv, GITHUB_ACTIONS: 'true' };
      expect(CIDetection.isCI()).toBe(true);
    });

    it('should detect GitLab CI', () => {
      process.env = { ...originalEnv, GITLAB_CI: 'true' };
      expect(CIDetection.isCI()).toBe(true);
    });

    it('should detect Jenkins', () => {
      process.env = { ...originalEnv, JENKINS_URL: 'http://jenkins.example.com' };
      expect(CIDetection.isCI()).toBe(true);
    });

    it('should detect generic CI', () => {
      process.env = { ...originalEnv, CI: 'true' };
      expect(CIDetection.isCI()).toBe(true);
    });

    it('should return false when not in CI', () => {
      process.env = { ...originalEnv };
      delete process.env.CI;
      delete process.env.GITHUB_ACTIONS;
      delete process.env.GITLAB_CI;
      delete process.env.JENKINS_URL;
      expect(CIDetection.isCI()).toBe(false);
    });
  });

  describe('detectPlatform', () => {
    it('should detect GitHub Actions', () => {
      process.env = { ...originalEnv, GITHUB_ACTIONS: 'true' };
      expect(CIDetection.detectPlatform()).toBe('github-actions');
    });

    it('should detect GitLab CI', () => {
      process.env = { ...originalEnv, GITLAB_CI: 'true' };
      expect(CIDetection.detectPlatform()).toBe('gitlab-ci');
    });

    it('should detect Jenkins', () => {
      process.env = { ...originalEnv, JENKINS_URL: 'http://jenkins.example.com' };
      expect(CIDetection.detectPlatform()).toBe('jenkins');
    });

    it('should return null when not in CI', () => {
      process.env = { ...originalEnv };
      delete process.env.CI;
      delete process.env.GITHUB_ACTIONS;
      delete process.env.GITLAB_CI;
      delete process.env.JENKINS_URL;
      expect(CIDetection.detectPlatform()).toBe(null);
    });
  });

  describe('getConfig', () => {
    it('should return CI configuration for GitHub Actions', () => {
      process.env = {
        ...originalEnv,
        GITHUB_ACTIONS: 'true',
        GITHUB_WORKFLOW: 'test',
        GITHUB_RUN_ID: '123',
      };
      const config = CIDetection.getConfig();
      expect(config.isCI).toBe(true);
      expect(config.platform).toBe('github-actions');
      expect(config.workflow).toBe('test');
      expect(config.runId).toBe('123');
    });

    it('should return non-CI configuration', () => {
      process.env = { ...originalEnv };
      delete process.env.CI;
      const config = CIDetection.getConfig();
      expect(config.isCI).toBe(false);
      expect(config.platform).toBe(null);
    });
  });

  describe('getExitCode', () => {
    it('should return 0 for passing score', () => {
      expect(CIDetection.getExitCode(85, 70)).toBe(0);
    });

    it('should return 1 for failing score', () => {
      expect(CIDetection.getExitCode(65, 70)).toBe(1);
    });

    it('should use default threshold', () => {
      expect(CIDetection.getExitCode(75)).toBe(0);
      expect(CIDetection.getExitCode(65)).toBe(1);
    });
  });
});
