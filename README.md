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

This project is in active development. **See [plan.md](plan.md) for the complete detailed roadmap with all tasks and subtasks.**

**Current Phase:** Phase 1 - Foundation & Core Infrastructure (90% complete)

### 📋 Complete Project Plan

**The project plan is the single source of truth for all development tasks.** It contains:
- **8 Phases** with detailed breakdowns
- **50+ Tasks** with actionable subtasks
- **Clear milestones** and deliverables
- **Open for contribution** - pick any task and start coding!

👉 **[View Complete Plan →](plan.md)**

## 🤝 Contributing

We welcome contributions! This project needs your help to establish world-class security standards.

### Quick Start for Contributors

1. **Read the Plan**: Start with [plan.md](plan.md) - it contains all tasks organized by phase
2. **Pick a Task**: Choose any uncompleted task from the plan
3. **Read Guidelines**: Check [CONTRIBUTING.md](CONTRIBUTING.md) for development setup
4. **Start Coding**: Create a branch and implement your task
5. **Submit PR**: Follow the pull request process

### Where to Contribute

- **Phase 1 Tasks**: Complete remaining foundation work
- **Phase 2 Tasks**: Implement security rules (lifecycle scripts, network calls, etc.)
- **Phase 3 Tasks**: Build CLI tool
- **Phase 4 Tasks**: CI/CD integrations
- **Phase 5 Tasks**: Advanced features (caching, ML, etc.)
- **Documentation**: Improve docs, add examples
- **Testing**: Add tests, improve coverage

**See [plan.md](plan.md) for the complete task list!**

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

