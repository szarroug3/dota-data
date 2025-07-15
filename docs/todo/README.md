# Todo System

This directory contains todo lists for each AI role in the Dota 2 Data Dashboard project.

## 📁 Structure

```
docs/todo/
├── README.md                   # This navigation file

├── backend.md                  # Backend Developer tasks
├── frontend.md                 # Frontend Developer tasks
├── ux.md                       # UX Designer tasks
├── qa.md                       # QA Engineer tasks
├── systems.md                  # Systems Architect tasks
├── documentation.md            # Documentation Specialist tasks
└── shared.md                   # Cross-role coordination tasks
```

## 🎯 Role Responsibilities

| Role | Todo File | Primary Focus |
|------|-----------|---------------|

| **Backend Developer** | `backend.md` | API development, data flow, services |
| **Frontend Developer** | `frontend.md` | UI components, pages, contexts |
| **UX Designer** | `ux.md` | Design system, accessibility, UI patterns |
| **QA Engineer** | `qa.md` | Testing, bug tracking, quality metrics |
| **Systems Architect** | `systems.md` | Infrastructure, caching, deployment |
| **Documentation Specialist** | `documentation.md` | Documentation coordination, standards |

## 📝 Todo File Structure

Each todo file follows this structure:

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

## 🔄 Coordination

### **Shared Tasks**
- **Cross-role tasks**: Use `shared.md` for coordination
- **Dependencies**: Document task dependencies clearly
- **Updates**: Keep todo files current with progress

### **Status Tracking**
- **assigned**: Task has been assigned but not started
- **in-progress**: Task is currently being worked on
- **complete**: Task is finished and quality checks pass
- **needs-revision**: Task needs fixes or improvements

### **Priority Levels**
- **high**: Critical for project success, immediate attention needed
- **medium**: Important but not urgent
- **low**: Nice to have, can be deferred

## 📊 Success Metrics

### **Todo Management**
- **Completeness**: All roles maintain current todo lists
- **Accuracy**: Todo status reflects actual progress
- **Coordination**: Cross-role dependencies are tracked
- **Updates**: Todo files are updated regularly

### **Quality Standards**
- **Clear Descriptions**: Tasks are well-defined
- **Proper Dependencies**: Task relationships are documented
- **Status Accuracy**: Current status reflects reality
- **File References**: Relevant files are documented

## 🎯 Best Practices

1. **Update Regularly**: Keep todo files current with progress
2. **Be Specific**: Include clear task descriptions and file paths
3. **Track Dependencies**: Document relationships between tasks
4. **Coordinate**: Communicate with other roles for shared tasks
5. **Quality Checks**: Document lint/type-check/test results
6. **Archive Completed**: Move completed tasks to history section

## 📞 Quick Commands

```bash
# View all todo files
find docs/todo -name "*.md"

# Count todo items by role

echo "Backend: $(grep -c "###" docs/todo/backend.md)"
echo "Frontend: $(grep -c "###" docs/todo/frontend.md)"
echo "QA: $(grep -c "###" docs/todo/qa.md)"
echo "Systems: $(grep -c "###" docs/todo/systems.md)"
echo "Documentation: $(grep -c "###" docs/todo/documentation.md)"
```

This centralized todo system ensures all AI roles have clear task tracking and coordination. 