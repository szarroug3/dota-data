# AI Roles Quick Reference

Quick reference for where each AI role should place their documentation files.

## 🎯 Role File Locations

| Role | Primary Location | Todo Location | Key Files |
|------|-----------------|---------------|-----------|

| **Backend Developer** | `/docs/architecture/backend/` | `/docs/todo/backend.md` | `api-endpoints.md`, `data-flow.md` |
| **Frontend Developer** | `/docs/architecture/frontend/` | `/docs/todo/frontend.md` | `components.md`, `pages.md`, `contexts.md` |
| **UX Designer** | `/src/components/` + `/docs/design/` | `/docs/todo/ux.md` | Stateless UI components, design system, accessibility |
| **QA Engineer** | `/docs/qa-reports/` | `/docs/todo/qa.md` | `test-plans/`, `bug-reports/`, `quality-metrics/` |
| **Systems Architect** | `/docs/architecture/infrastructure/` | `/docs/todo/systems.md` | `caching.md`, `rate-limiting.md`, `deployment.md` |
| **Documentation Specialist** | `/docs/` (all areas) | `/docs/todo/documentation.md` | Cross-references, standards, coordination |

## 📝 Todo System

### **Centralized Location**: `/docs/todo/`
```
docs/todo/
├── README.md                   # Todo system navigation

├── backend.md                  # Backend Developer tasks
├── frontend.md                 # Frontend Developer tasks
├── ux.md                       # UX Designer tasks
├── qa.md                       # QA Engineer tasks
├── systems.md                  # Systems Architect tasks
├── documentation.md            # Documentation Specialist tasks
└── shared.md                   # Cross-role coordination tasks
```

### **Todo File Structure**
```markdown
# [Role] Todo List

## 🎯 Current Tasks
### [Task Name]
- **Status**: [assigned/in-progress/complete/needs-revision]
- **Priority**: [high/medium/low]
- **Assigned To**: [Chat 1/Chat 2/Self]
- **Description**: [task description]
- **Files**: [relevant file paths]

## ✅ Completed Tasks
### [Task Name]
- **Completed**: [date]
- **Files Modified**: [list of files]

## 📋 Upcoming Tasks
### [Task Name]
- **Priority**: [high/medium/low]
- **Dependencies**: [prerequisites]
```

## 📁 File Naming Patterns

### **By Role**

- **Backend Developer**: `api-*.md`, `service-*.md`
- **Frontend Developer**: `component-*.md`, `page-*.md`
- **UX Designer**: `*.tsx` (components), `design-*.md`, `accessibility-*.md`
- **QA Engineer**: `test-*.md`, `bug-*.md`, `quality-*.md`
- **Systems Architect**: `infrastructure-*.md`, `deployment-*.md`
- **Documentation Specialist**: `cross-reference-*.md`, `standards-*.md`

### **By Type**
- **Architecture**: `*-architecture.md`
- **API**: `*-api.md`
- **Testing**: `*-test.md`
- **Quality**: `*-quality.md`
- **Implementation**: `*-implementation.md`
- **Todo**: `*.md` in `/docs/todo/`

## 🔄 Shared Files

| File | Primary Owner | Secondary Contributors |
|------|---------------|----------------------|
| `ui-standards.md` | UX Designer | Frontend Developer |
| `src/components/` | UX Designer | Frontend Developer |
| `api-endpoints.md` | Backend Developer | Frontend Developer |

| `test-plans/` | QA Engineer | Backend/Frontend Developers |
| `shared.md` (todo) | Documentation Specialist | All roles |

## ⚡ Quick Commands

### **Find files by role:**
```bash
# Project Manager files
find docs/implementation -name "*.md"

# Backend Developer files
find docs/architecture/backend -name "*.md"

# Frontend Developer files
find docs/architecture/frontend -name "*.md"

# QA Engineer files
find docs/qa-reports -name "*.md"

# Systems Architect files
find docs/architecture/infrastructure -name "*.md"

# Todo files
find docs/todo -name "*.md"
```

### **Count files by role:**
```bash
# Count all documentation files
find docs -name "*.md" | wc -l

# Count by role
echo "Project Manager: $(find docs/implementation -name "*.md" | wc -l)"
echo "Backend: $(find docs/architecture/backend -name "*.md" | wc -l)"
echo "Frontend: $(find docs/architecture/frontend -name "*.md" | wc -l)"
echo "QA: $(find docs/qa-reports -name "*.md" | wc -l)"
echo "Infrastructure: $(find docs/architecture/infrastructure -name "*.md" | wc -l)"
echo "Todo: $(find docs/todo -name "*.md" | wc -l)"
```

## 🎯 Best Practices

1. **Own Your Domain**: Take full responsibility for your documentation area and implementation
2. **Cross-Reference**: Link to related documentation from other roles
3. **Update Regularly**: Keep documentation current with code changes
4. **Coordinate**: Communicate changes that affect other roles
5. **Follow Naming**: Use consistent file naming patterns
6. **Maintain Todo**: Keep your todo file current and organized
7. **Self-Manage**: Each role manages their own implementation and todo list

## 📞 Coordination

- **Content Disputes**: Documentation Specialist mediates
- **File Ownership**: Each role owns their domain
- **Cross-References**: Documentation Specialist maintains
- **Standards**: Documentation Specialist enforces
- **Implementation**: Each role manages their own implementation

For detailed organization guidelines, see: [AI Roles Documentation Organization](./ai-roles-organization.md) 