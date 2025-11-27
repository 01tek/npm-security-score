# Project Structure

This document describes the structure of the npm-security-score project.

## Directory Layout

```
npm-security-score/
├── .github/              # GitHub configuration
│   └── ISSUE_TEMPLATE/  # Issue templates
├── bin/                  # CLI executables
│   └── cli.js           # Main CLI entry point
├── docs/                 # Documentation
│   └── PROJECT_STRUCTURE.md
├── src/                  # Source code
│   ├── api/             # External API clients (npm, GitHub, etc.)
│   ├── cli/             # CLI implementation
│   ├── core/            # Core scoring engine
│   ├── rules/           # Security rule implementations
│   ├── types/           # TypeScript types (if using TS)
│   ├── utils/           # Utility functions
│   └── index.js         # Main entry point
├── tests/               # Test files
│   ├── integration/     # Integration tests
│   └── unit/            # Unit tests
├── .editorconfig        # Editor configuration
├── .gitignore          # Git ignore rules
├── CHANGELOG.md        # Change log
├── CODE_OF_CONDUCT.md  # Code of conduct
├── CONTRIBUTING.md     # Contribution guidelines
├── LICENSE             # MIT License
├── package.json        # npm package configuration
├── plan.md             # Detailed project plan
└── README.md           # Project README
```

## Source Code Organization

### `src/core/`
Core scoring engine and calculation logic.

### `src/rules/`
Individual security rule implementations. Each rule should:
- Evaluate a specific security aspect
- Return a deduction amount and details
- Be independently testable

### `src/api/`
Clients for external APIs:
- npm registry API
- GitHub API
- Advisory databases (npm, GitHub Security)

### `src/cli/`
Command-line interface implementation.

### `src/utils/`
Shared utility functions used across the project.

## Testing Structure

Tests mirror the source structure:
- `tests/unit/` - Unit tests for individual modules
- `tests/integration/` - Integration tests for workflows

## Documentation

- `README.md` - Project overview and quick start
- `CONTRIBUTING.md` - How to contribute
- `plan.md` - Detailed project plan with all tasks
- `docs/` - Additional documentation

## Getting Started

See [CONTRIBUTING.md](../CONTRIBUTING.md) for development setup instructions.

