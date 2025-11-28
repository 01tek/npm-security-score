# CI/CD Integration Guide

This guide explains how to integrate npm-security-score into your CI/CD pipelines.

## Exit Codes

npm-security-score uses the following exit codes for CI/CD integration:

- `0` - Success (all packages passed)
- `1` - Failure (packages below threshold or errors)

## Environment Variables

The following environment variables can be used to configure npm-security-score:

- `NPM_SECURITY_SCORE_CONFIG` - Path to config file
- `NPM_SECURITY_SCORE_FAIL_BELOW` - Threshold for failing (default: 70)
- `CI` - Automatically detected, disables colors and interactive mode

## GitHub Actions

### Basic Usage

```yaml
name: Security Check

on: [pull_request, push]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -g npm-security-score
      - run: npm-security-score score package.json --fail-below 70
```

### Using the Action

```yaml
name: Security Check

on: [pull_request, push]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - uses: 01tek/npm-security-score@main
        with:
          package: 'package.json'
          fail-below: '70'
          comment-on-pr: 'true'
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Action Inputs

- `package` - Package name or path to package.json (default: `package.json`)
- `fail-below` - Fail if score is below this threshold (default: `70`)
- `config` - Path to config file (optional)
- `github-token` - GitHub token for PR comments (optional)
- `comment-on-pr` - Comment on PR with results (default: `true`)
- `json-output` - Output results as JSON (default: `false`)
- `verbose` - Verbose output (default: `false`)

### Action Outputs

- `score` - Security score (0-100)
- `band` - Score band (SAFE, REVIEW, HIGH_RISK, BLOCK)
- `passed` - Whether the check passed
- `report` - Full JSON report

## GitLab CI

### Basic Usage

```yaml
stages:
  - security

security-score:
  stage: security
  image: node:20
  script:
    - npm install -g npm-security-score
    - npm-security-score batch $(cat package.json | jq -r '.dependencies // {}, .devDependencies // {} | keys[]' | tr '\n' ' ') --fail-below 70
  only:
    - merge_requests
    - main
```

### Using the Template

Copy `.gitlab-ci.yml.example` to your project and customize as needed.

## Jenkins

### Basic Usage

```groovy
stage('Security Check') {
    steps {
        sh '''
            npm install -g npm-security-score
            npm-security-score batch express lodash axios --fail-below 70
        '''
    }
}
```

### Using the Jenkinsfile Template

Copy `Jenkinsfile.example` to your project and customize as needed.

## Generic CI/CD

### Using Exit Codes

```bash
#!/bin/bash
npm-security-score score express --fail-below 70
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    echo "Security check failed"
    exit 1
fi
```

### Using Environment Variables

```bash
export NPM_SECURITY_SCORE_FAIL_BELOW=70
export NPM_SECURITY_SCORE_CONFIG=./security-config.json
npm-security-score score express
```

### CI Detection

npm-security-score automatically detects CI environments and:
- Disables colors
- Disables interactive mode
- Uses non-interactive output

## Best Practices

1. **Set Appropriate Thresholds**: Use `--fail-below` to enforce minimum security scores
2. **Scan All Dependencies**: Use `package.json` to scan all dependencies
3. **Comment on PRs**: Enable PR comments to provide feedback
4. **Cache Results**: Consider caching scores for faster builds
5. **Fail Fast**: Use exit codes to fail builds on security issues

## Examples

### GitHub Actions - Full Example

```yaml
name: Security Check

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - uses: 01tek/npm-security-score@main
        with:
          package: 'package.json'
          fail-below: '70'
          comment-on-pr: 'true'
          github-token: ${{ secrets.GITHUB_TOKEN }}
          verbose: 'true'
```

### GitLab CI - Full Example

```yaml
stages:
  - security

security-score:
  stage: security
  image: node:20
  before_script:
    - npm ci
  script:
    - |
      npx npm-security-score batch $(cat package.json | jq -r '.dependencies // {}, .devDependencies // {} | keys[]' | tr '\n' ' ') --fail-below 70 --json > security-report.json
  artifacts:
    paths:
      - security-report.json
    expire_in: 1 week
  only:
    - merge_requests
    - main
```

## Troubleshooting

### Action Not Found

Make sure the action is published or use a local path:
```yaml
- uses: ./
```

### PR Comments Not Working

Ensure `github-token` is provided and has appropriate permissions.

### Exit Code Issues

Check that `--fail-below` is set correctly and packages are scoring above the threshold.

