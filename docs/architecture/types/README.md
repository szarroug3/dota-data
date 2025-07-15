# Type Organization

This directory contains the TypeScript type organization documentation for the Dota Scout Assistant.

## 📁 Structure

```
docs/architecture/types/
├── README.md                    # This navigation file
└── organization.md              # TypeScript type organization
```

## 📋 Documentation Overview

### **[Organization](./organization.md)** - TypeScript Type Organization
- Type organization patterns and principles
- Context value types and hook return types
- Component prop types and interface definitions
- Type safety improvements and best practices

## 🔗 Related Documentation

- **[Frontend Architecture](../frontend/)**: Frontend component architecture
- **[Backend Architecture](../backend/)**: Backend data flow and API patterns
- **[Infrastructure](../infrastructure/)**: Caching, rate limiting, and queueing
- **[Implementation](../implementation/)**: Project implementation status

## 🎯 Type Safety Principles

### **Type Organization**
- **Centralized Types**: All types in `src/types/` or subdirectories
- **Context Types**: Context value types in `src/types/contexts/`
- **Component Types**: Component prop types in `src/types/components/`
- **Hook Types**: Hook return types in `src/types/hooks/`

### **Type Safety**
- **No `any` or `unknown`**: Strict typing throughout
- **Interface Definitions**: Clear type contracts
- **Generic Constraints**: Proper generic usage
- **Type Validation**: Runtime type checking where needed

### **Best Practices**
- **Colocated Types**: Types with their related code
- **Shared Types**: Common types in centralized location
- **Type Imports**: Consistent import patterns
- **Documentation**: Clear type documentation 