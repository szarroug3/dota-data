# AI Roles Documentation Organization

This document defines where each AI role should place their documentation files to maintain clear ownership and avoid conflicts.

## 📋 AI Roles Overview

| Role | Primary Focus | Documentation Location | Todo Location | Key Responsibilities |
|------|---------------|----------------------|---------------|---------------------|

| **Backend Developer** | API & server-side logic | `/docs/architecture/backend/` | `/docs/todo/backend.md` | API docs, data flow, services |
| **Frontend Developer** | UI components & client-side | `/docs/architecture/frontend/` | `/docs/todo/frontend.md` | Component docs, UI patterns |
| **UX Designer** | User experience & design | `/src/components/` + `/docs/design/` | `/docs/todo/ux.md` | Stateless UI components, design system, accessibility |
| **QA Engineer** | Testing & quality assurance | `/docs/qa-reports/` | `/docs/todo/qa.md` | Test plans, bug reports, quality metrics |
| **Systems Architect** | Infrastructure & architecture | `/docs/architecture/infrastructure/` | `/docs/todo/systems.md` | Caching, rate limiting, deployment |
| **Documentation Specialist** | Documentation maintenance | `/docs/` (all areas) | `/docs/todo/documentation.md` | Cross-role documentation coordination |

## 📁 File Organization by Role



### **Backend Developer** - `/docs/architecture/backend/` + `/docs/todo/backend.md`
```
docs/architecture/backend/
├── README.md                    # Backend navigation
├── data-flow.md                # Backend data flow patterns
├── api-endpoints.md            # API endpoint documentation
├── services.md                 # Service layer architecture
├── database.md                 # Database schema and queries
└── external-apis.md            # External API integrations

docs/todo/
└── backend.md                  # Backend Developer todo list
```

**Responsibilities:**
- ✅ API endpoint documentation
- ✅ Data flow diagrams
- ✅ Service layer architecture
- ✅ Database schema documentation
- ✅ External API integration docs
- ✅ Maintain todo list in `/docs/todo/backend.md`

### **Frontend Developer** - `/docs/architecture/frontend/` + `/docs/todo/frontend.md`
```
docs/architecture/frontend/
├── README.md                    # Frontend navigation
├── overview.md                 # Universal requirements
├── contexts.md                 # Data flow and state management
├── pages.md                    # Page architecture and routing
├── components.md               # Component patterns and organization
└── ui-standards.md            # UI patterns and accessibility

docs/todo/
└── frontend.md                 # Frontend Developer todo list
```

**Responsibilities:**
- ✅ Component architecture documentation
- ✅ Context patterns and data flow
- ✅ Page structure and routing
- ✅ Component testing strategies
- ✅ Frontend performance optimization
- ✅ Maintain todo list in `/docs/todo/frontend.md`

### **UX Designer** - `/src/components/` + `/docs/design/` + `/docs/todo/ux.md`
```
src/components/                 # Stateless UI components (primary work area)
├── ui/                        # Base UI components
├── layout/                    # Layout components
├── forms/                     # Form components
├── navigation/                # Navigation components
└── pages/                     # Page-level components

docs/design/
├── README.md                   # UX design navigation
├── design-system/              # Design system documentation
│   ├── colors.md              # Color palette and usage
│   ├── typography.md          # Typography scale and fonts
│   ├── spacing.md             # Spacing system and grid
│   ├── icons.md               # Icon system and usage
│   └── components.md          # UI component specifications
├── accessibility/              # Accessibility documentation
│   ├── wcag-compliance.md    # WCAG 2.1 AA compliance
│   ├── keyboard-navigation.md # Keyboard navigation patterns
│   ├── screen-reader.md      # Screen reader support
│   └── color-contrast.md     # Color contrast requirements
├── responsive-design/          # Responsive design documentation
│   ├── breakpoints.md        # Breakpoint system
│   ├── mobile-first.md       # Mobile-first approach
│   └── adaptive-layouts.md   # Adaptive layout patterns
└── handoff/                   # Design-to-development handoff
    ├── component-specs.md     # Component specifications
    ├── static-content.md      # Static content guidelines
    └── frontend-integration.md # Frontend integration guide

docs/todo/
└── ux.md                      # UX Designer todo list
```

**Responsibilities:**
- ✅ **Build accessible, mobile-responsive UI components** using semantic HTML and Tailwind CSS
- ✅ **Use static content** (hardcoded values) to simulate real data
- ✅ **Focus on layout, styling, accessibility**—not on data, hooks, or interactivity
- ✅ **Maintain visual consistency** across all pages
- ✅ **Ensure components are production-ready** for frontend integration
- ✅ **Design system documentation** and maintenance
- ✅ **Accessibility standards** and compliance
- ✅ **Responsive design patterns** and breakpoints
- ✅ **Design-to-development handoff** documentation
- ✅ **Maintain todo list** in `/docs/todo/ux.md`

**Constraints:**
- ❌ Do NOT use hooks, context, or client-side state logic
- ❌ Do NOT fetch data or write backend code
- ❌ Do NOT modify files outside `/src/components/`, `/docs/design/`, or todo/implementation folders

### **QA Engineer** - `/docs/qa-reports/` + `/docs/todo/qa.md`
```
docs/qa-reports/
├── README.md                   # QA navigation
├── test-plans/                 # Test strategy and plans
│   ├── unit-tests.md          # Unit testing strategy
│   ├── integration-tests.md   # Integration testing
│   └── e2e-tests.md          # End-to-end testing
├── bug-reports/               # Bug tracking and reports
│   ├── accessibility-bugs.md  # Accessibility issues
│   ├── performance-bugs.md    # Performance issues
│   └── functional-bugs.md     # Functional issues
├── quality-metrics/           # Quality measurement
│   ├── test-coverage.md      # Test coverage reports
│   ├── performance-metrics.md # Performance benchmarks
│   └── accessibility-scores.md # Accessibility compliance
└── test-results/             # Test execution results
    ├── unit-test-results.md  # Unit test results
    ├── integration-results.md # Integration test results
    └── e2e-results.md        # E2E test results

docs/todo/
└── qa.md                      # QA Engineer todo list
```

**Responsibilities:**
- ✅ Test strategy and planning
- ✅ Bug tracking and reporting
- ✅ Quality metrics collection
- ✅ Test execution and results
- ✅ Accessibility compliance testing
- ✅ Maintain todo list in `/docs/todo/qa.md`

### **Systems Architect** - `/docs/architecture/infrastructure/` + `/docs/todo/systems.md`
```
docs/architecture/infrastructure/
├── README.md                   # Infrastructure navigation
├── caching.md                  # Caching layer architecture
├── rate-limiting.md            # Rate limiting implementation
├── queueing.md                 # Queue management
├── project-structure.md        # Folder organization
├── deployment.md               # Deployment architecture
├── monitoring.md               # Monitoring and logging
└── security.md                 # Security architecture

docs/todo/
└── systems.md                  # Systems Architect todo list
```

**Responsibilities:**
- ✅ Infrastructure architecture
- ✅ Caching and performance
- ✅ Rate limiting and security
- ✅ Deployment strategies
- ✅ Monitoring and observability
- ✅ Maintain todo list in `/docs/todo/systems.md`

### **Documentation Specialist** - `/docs/` (All Areas) + `/docs/todo/documentation.md`
```
docs/
├── README.md                   # Main documentation index
├── architecture/               # All architecture docs
├── implementation/             # Implementation tracking
├── development/                # Development guides
├── qa-reports/                # QA and testing docs
└── cross-references.md        # Cross-role documentation links

docs/todo/
└── documentation.md            # Documentation Specialist todo list
```

**Responsibilities:**
- ✅ Maintain documentation consistency
- ✅ Update cross-references
- ✅ Ensure documentation accuracy
- ✅ Coordinate between roles
- ✅ Maintain documentation standards
- ✅ Maintain todo list in `/docs/todo/documentation.md`

## 📝 Todo System Organization

### **Centralized Todo Location**: `/docs/todo/`

```markdown
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
Each todo file should follow this structure:

```markdown
# [Role] Todo List

## 🎯 Current Tasks

### [Task Name]
- **Status**: [assigned/in-progress/complete/needs-revision]
- **Priority**: [high/medium/low]
- **Assigned To**: [Chat 1/Chat 2/Self]
- **Due Date**: [date if applicable]
- **Description**: [task description]
- **Files**: [relevant file paths]
- **Dependencies**: [other tasks or roles]

## ✅ Completed Tasks

### [Task Name]
- **Completed**: [date]
- **Files Modified**: [list of files]
- **Quality Checks**: [lint/type-check/test results]

## 📋 Upcoming Tasks

### [Task Name]
- **Priority**: [high/medium/low]
- **Estimated Effort**: [time estimate]
- **Dependencies**: [prerequisites]
```

## 🔄 Collaboration Guidelines

### **Shared Files**
Some files may be edited by multiple roles:

| File | Primary Owner | Secondary Contributors |
|------|---------------|----------------------|
| `docs/architecture/frontend/ui-standards.md` | UX Designer | Frontend Developer |
| `docs/design/` | UX Designer | Frontend Developer |
| `docs/architecture/backend/api-endpoints.md` | Backend Developer | Frontend Developer |

| `docs/qa-reports/test-plans/` | QA Engineer | Backend/Frontend Developers |
| `docs/todo/shared.md` | Documentation Specialist | All roles |

### **Coordination Process**
1. **Primary Owner**: Makes initial changes
2. **Secondary Contributors**: Review and suggest updates
3. **Documentation Specialist**: Ensures consistency and cross-references
4. **Project Manager**: Tracks completion and dependencies
5. **Todo Updates**: Each role maintains their own todo file

### **Conflict Resolution**
- **Content Disputes**: Documentation Specialist mediates
- **File Ownership**: Project Manager decides
- **Cross-References**: Documentation Specialist maintains
- **Standards**: Documentation Specialist enforces
- **Todo Conflicts**: Project Manager coordinates

## 📝 File Naming Conventions

### **By Role**
- **Project Manager**: `milestone-*.md`, `progress-*.md`
- **Backend Developer**: `api-*.md`, `service-*.md`
- **Frontend Developer**: `component-*.md`, `page-*.md`
- **UX Designer**: `design-*.md`, `accessibility-*.md`
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

## 🎯 Best Practices

### **For Each Role**
1. **Own Your Domain**: Take full responsibility for your documentation area
2. **Cross-Reference**: Link to related documentation from other roles
3. **Update Regularly**: Keep documentation current with code changes
4. **Review Others**: Provide feedback on related documentation
5. **Coordinate**: Communicate changes that affect other roles
6. **Maintain Todo**: Keep your todo file current and organized

### **For Documentation Specialist**
1. **Maintain Standards**: Ensure consistent formatting and structure
2. **Cross-Reference**: Keep links between related documents current
3. **Coordinate**: Facilitate communication between roles
4. **Quality Control**: Review documentation for accuracy and completeness
5. **Archive**: Maintain historical documentation when needed
6. **Todo Coordination**: Maintain shared todo file for cross-role tasks

### **For Project Manager**
1. **Track Progress**: Monitor documentation completion
2. **Coordinate**: Ensure all roles are contributing
3. **Prioritize**: Set documentation priorities
4. **Review**: Ensure documentation meets project needs
5. **Archive**: Maintain project history
6. **Todo Management**: Coordinate todo updates across all roles

## 📊 Success Metrics

### **Quality Metrics**
- **Completeness**: All areas have adequate documentation
- **Accuracy**: Documentation matches current codebase
- **Consistency**: Uniform formatting and structure
- **Accessibility**: Documentation is easy to navigate

### **Collaboration Metrics**
- **Cross-References**: Proper linking between related docs
- **Review Process**: Regular documentation reviews
- **Update Frequency**: Documentation stays current
- **Role Coordination**: Clear communication between roles
- **Todo Management**: All roles maintain current todo lists

This organization ensures each AI role has clear ownership while maintaining collaboration and consistency across the documentation, with a centralized todo system for better coordination. 