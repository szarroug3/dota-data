# Documentation

This directory contains the core documentation for the Dota Data application.

## 📋 Core Documents

### [`architecture.md`](./architecture.md)

**Current system architecture and design principles**

- Overview & principles
- Directory structure
- Single context architecture (AppDataProvider)
- Data flow patterns
- Generic state management system (implemented)
- Backend and frontend architecture
- Testing and build processes

### [`data-flow-analysis.md`](./data-flow-analysis.md)

**Comprehensive analysis of all data flows in the application**

- 21 detailed data flow scenarios
- App hydration flows (4 scenarios)
- Team management flows (7 scenarios)
- Match/Player operations (4 scenarios)
- Additional flows (6 scenarios)
- Error handling patterns
- Loading state management
- Cache management strategies

### [`typescript-unknown-usage.md`](./typescript-unknown-usage.md)

**TypeScript `unknown` type usage guidelines**

- When to use `unknown` appropriately
- Best practices and patterns
- Migration strategies
- Code examples from the codebase

## 🎯 Quick Reference

- **New to the project?** Start with `architecture.md`
- **Understanding data flows?** See `data-flow-analysis.md`
- **TypeScript questions?** Check `typescript-unknown-usage.md`

## 📝 Document Status

All documents are current and reflect the implemented state of the application. The generic state management system is fully implemented and all single source of truth violations have been eliminated.
