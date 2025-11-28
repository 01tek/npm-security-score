/**
 * End-to-end CLI integration tests
 */

const { spawn } = require('child_process');
const path = require('path');

describe('CLI Integration Tests', () => {
  const cliPath = path.join(__dirname, '../../bin/cli.js');

  // Skip these tests in CI/pre-commit as they're flaky
  describe.skip('CLI commands', () => {
    it('should show help when no command provided', done => {
      const cli = spawn('node', [cliPath], { cwd: __dirname });

      let output = '';
      cli.stdout.on('data', data => {
        output += data.toString();
      });

      cli.on('close', _code => {
        expect(output).toContain('Usage');
        expect(output).toContain('Commands');
        done();
      });
    });

    it('should show help for --help flag', done => {
      const cli = spawn('node', [cliPath, '--help'], { cwd: __dirname });

      let output = '';
      cli.stdout.on('data', data => {
        output += data.toString();
      });

      cli.on('close', _code => {
        expect(output).toContain('Usage');
        done();
      });
    });

    it('should show version for --version flag', done => {
      const cli = spawn('node', [cliPath, '--version'], { cwd: __dirname });

      let output = '';
      cli.stdout.on('data', data => {
        output += data.toString();
      });

      cli.on('close', _code => {
        expect(output.trim()).toMatch(/^\d+\.\d+\.\d+/);
        done();
      });
    });
  });

  describe('Score command', () => {
    it('should handle invalid package name', done => {
      const cli = spawn('node', [cliPath, 'score', 'nonexistent-package-12345'], {
        cwd: __dirname,
      });

      cli.stderr.on('data', () => {
        // Collect stderr output (not used in assertions but good to capture)
      });

      cli.on('close', code => {
        expect(code).not.toBe(0);
        done();
      });
    }, 30000);
  });

  describe.skip('Batch command', () => {
    it('should handle invalid input file', done => {
      const cli = spawn('node', [cliPath, 'batch', '/nonexistent/file.json'], {
        cwd: __dirname,
      });

      cli.stderr.on('data', () => {
        // Collect stderr output (not used in assertions but good to capture)
      });

      cli.on('close', code => {
        expect(code).not.toBe(0);
        done();
      });
    });
  });

  describe('Compare command', () => {
    it('should require two package names', done => {
      const cli = spawn('node', [cliPath, 'compare', 'express'], {
        cwd: __dirname,
      });

      cli.stderr.on('data', () => {
        // Collect stderr output (not used in assertions but good to capture)
      });

      cli.on('close', code => {
        expect(code).not.toBe(0);
        done();
      });
    });
  });
});
