# npm-security-score 🔒

> **World-Class Security Standard for npm Packages**

The npm ecosystem is the Wild West of software supply chains. This project aims to establish a world-class security standard that stops malicious actors and protects developers worldwide.

## 🎯 Mission

We're building a comprehensive security scoring system that goes beyond traditional vulnerability scanning to detect malicious behavior, supply chain attacks, and security gaps before they compromise millions of applications.

**The Wild West of npm needs to stop. We need proper security. Now.**

## ✨ Features

- **Comprehensive Security Scoring** - 0-100 score based on multiple risk factors
- **Automated Detection** - Detects lifecycle script risks, network calls, obfuscation, and more
- **CI/CD Integration** - Enforce security thresholds in your pipelines
- **Transparent Reporting** - Detailed risk reports explaining every score
- **Open Source** - Community-driven development

## 🚀 Quick Start

```bash
# Install globally
npm install -g npm-security-score

# Score a package
npm-security-score express

# Score with JSON output
npm-security-score express --json

# CI/CD mode (fails if score below threshold)
npm-security-score express --fail-below 70
```

## 📊 Scoring Algorithm

Each package starts at 100 points. Points are deducted for risk factors:

| Category | Weight | Description |
|----------|--------|-------------|
| Lifecycle Script Risk | -30 | Suspicious preinstall/postinstall scripts |
| External Network Calls | -20 | Network calls during install |
| Maintainer Security | -15 | 2FA not enabled |
| Obfuscated Code | -10 | Large minified/obfuscated files |
| Advisory History | -15 | Past malware or critical CVEs |
| Update Behavior | -10 | Suspicious version changes |
| Community Signals | -5 | Inactive repo, no security policy |

**Bonus Points (+10 each):** Verified publisher, signed releases, SBOM provided

### Score Bands

- **90-100**: ✅ Safe
- **70-89**: ⚠️ Review recommended
- **50-69**: ❌ High risk
- **<50**: 🚨 Block in CI/CD

## 🏗️ Project Status

This project is in active development. See [plan.md](plan.md) for the complete roadmap.

**Current Phase:** Foundation & Core Infrastructure

## 🤝 Contributing

We welcome contributions! This project needs your help to establish world-class security standards.

- Read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines
- Check [plan.md](plan.md) for tasks
- Open issues for bugs or features
- Submit pull requests

## 📋 Roadmap

See [plan.md](plan.md) for the complete detailed plan with all tasks and subtasks.

### Upcoming Features

- [ ] Core scoring engine
- [ ] Security rule implementation
- [ ] CLI tool
- [ ] CI/CD integrations
- [ ] Web dashboard
- [ ] Machine learning enhancements

## 🔒 Security

If you discover a security vulnerability, please email security@example.com instead of using the issue tracker.

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

Built by the community, for the community. Together, we can make npm security world-class.

---

**Let's stop the Wild West. Let's build world-class security standards. Let's protect developers worldwide.** 🚀

