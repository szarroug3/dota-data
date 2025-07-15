# Icon System Documentation

## Overview

The icon system provides a consistent approach to using icons throughout the Dota 2 data dashboard application. This system uses **only custom Dota 2 specific icons and Lucide icons** - **no Unicode emojis are used**. If an icon is needed that doesn't exist in either category, a custom icon should be created.

## Icon Categories

### 1. Custom Dota 2 Icons

#### **Hero Attribute Icons**
- **Strength**: Custom SVG with muscle/fist design
- **Agility**: Custom SVG with running figure design
- **Intelligence**: Custom SVG with brain/lightbulb design
- **Universal**: Custom SVG with lightning bolt design

#### **Trend Icons**
- **Rising**: Custom SVG with upward arrow design
- **Falling**: Custom SVG with downward arrow design
- **Stable**: Custom SVG with horizontal arrow design

#### **External Site Icons**
- **Dotabuff**: Custom SVG with "D" branding
- **OpenDota**: Custom SVG with circular design
- **Stratz**: Custom SVG with castle design
- **Dota2ProTracker**: Custom SVG with "2T" branding

#### **Performance Icons**
- **Trophy**: Custom SVG with trophy design
- **Chart**: Custom SVG with bar chart design
- **Game**: Custom SVG with game controller design
- **Lightbulb**: Custom SVG with lightbulb design
- **Plus**: Custom SVG with plus symbol design
- **Stats**: Custom SVG with statistics design
- **Target**: Custom SVG with target design
- **User**: Custom SVG with user profile design
- **Document**: Custom SVG with document design

### 2. Lucide Icons

#### **Navigation Icons**
- **Menu**: `lucide:menu`
- **Home**: `lucide:home`
- **Settings**: `lucide:settings`
- **User**: `lucide:user`
- **Team**: `lucide:users`
- **Chart**: `lucide:bar-chart-3`
- **History**: `lucide:history`
- **Target**: `lucide:target`

#### **Action Icons**
- **Add**: `lucide:plus`
- **Edit**: `lucide:edit`
- **Delete**: `lucide:trash-2`
- **Refresh**: `lucide:refresh-cw`
- **Update**: `lucide:download`
- **Remove**: `lucide:x`
- **Save**: `lucide:save`
- **Cancel**: `lucide:x-circle`

#### **Status Icons**
- **Success**: `lucide:check-circle`
- **Error**: `lucide:x-circle`
- **Warning**: `lucide:alert-triangle`
- **Info**: `lucide:info`
- **Loading**: `lucide:loader-2`

#### **Data Icons**
- **Search**: `lucide:search`
- **Filter**: `lucide:filter`
- **Sort**: `lucide:arrow-up-down`
- **Export**: `lucide:download`
- **Import**: `lucide:upload`
- **Print**: `lucide:printer`
- **Share**: `lucide:share-2`

## Custom Icon Creation Plan

### **When to Create Custom Icons**

Custom icons should be created when:
1. **No suitable Lucide icon exists** for the specific concept
2. **Dota 2 specific concepts** need representation (hero attributes, game mechanics)
3. **Brand-specific elements** need custom representation
4. **Unique UI patterns** require specialized icons

### **Custom Icon Creation Process**

#### **Step 1: Icon Requirements Analysis**
- [ ] **Identify the concept** that needs an icon
- [ ] **Research existing icons** in Lucide library
- [ ] **Define the visual requirements** (size, style, context)
- [ ] **Document the use case** and context

#### **Step 2: Design Specification**
- [ ] **Create design brief** with concept description
- [ ] **Define visual style** (outline, filled, geometric, organic)
- [ ] **Specify size requirements** (24x24px base, scalable)
- [ ] **Define color requirements** (monochrome, theme-aware)

#### **Step 3: Icon Design**
- [ ] **Create initial sketches** or wireframes
- [ ] **Design in vector format** (SVG preferred)
- [ ] **Ensure scalability** and clarity at small sizes
- [ ] **Test in context** with surrounding elements

#### **Step 4: Implementation**
- [ ] **Create React component** following icon component pattern
- [ ] **Add TypeScript types** for props
- [ ] **Include accessibility features** (ARIA labels, roles)
- [ ] **Add to icon registry** and documentation

#### **Step 5: Quality Assurance**
- [ ] **Test at all sizes** (12px to 48px)
- [ ] **Verify in light/dark themes**
- [ ] **Check accessibility** (screen reader, keyboard)
- [ ] **Validate with team** for approval

### **Custom Icon Design Guidelines**

#### **Visual Style**
- **Consistent with Lucide**: Use similar stroke width and style
- **Simple and Clear**: Avoid complex details that don't scale
- **Scalable**: Design works at 12px to 48px sizes
- **Monochrome**: Use currentColor for theme compatibility

#### **Technical Requirements**
- **SVG Format**: Vector-based for scalability
- **24x24 ViewBox**: Standard size for consistency
- **Stroke-based**: 1.5px stroke width for consistency
- **Rounded caps**: strokeLinecap="round" for modern look

#### **Accessibility Requirements**
- **ARIA Labels**: Descriptive labels for screen readers
- **Keyboard Accessible**: Focusable when interactive
- **High Contrast**: Meets WCAG 2.1 AA standards
- **Semantic Meaning**: Clear purpose and context

### **Custom Icon Examples**

#### **Hero Attribute Icons**
```tsx
// Strength Icon Component
interface CustomIconProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  color?: string;
  'aria-label'?: string;
}

export const StrengthIcon: React.FC<CustomIconProps> = ({ 
  className = "w-5 h-5",
  'aria-label': ariaLabel = "Strength attribute"
}) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    role="img"
    aria-label={ariaLabel}
  >
    {/* Custom strength icon path */}
    <path d="M8 12h8M12 8v8M6 12a6 6 0 1 1 12 0 6 6 0 0 1-12 0z" />
  </svg>
);
```

#### **Trend Icons**
```tsx
// Rising Trend Icon Component
export const RisingTrendIcon: React.FC<CustomIconProps> = ({ 
  className = "w-5 h-5",
  'aria-label': ariaLabel = "Rising trend"
}) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    role="img"
    aria-label={ariaLabel}
  >
    {/* Custom rising trend icon path */}
    <path d="M3 17l6-6 4 4 8-8M21 17h-6" />
  </svg>
);
```

## Icon Sizing Standards

### **Size Variants**
- **XS**: `w-3 h-3` (12px × 12px) - For very small contexts
- **SM**: `w-4 h-4` (16px × 16px) - For small contexts
- **MD**: `w-5 h-5` (20px × 20px) - Default size
- **LG**: `w-6 h-6` (24px × 24px) - For larger contexts
- **XL**: `w-8 h-8` (32px × 32px) - For prominent contexts
- **2XL**: `w-12 h-12` (48px × 48px) - For hero contexts

### **Usage Guidelines**
- **Default**: Use MD size (20px) for most contexts
- **Buttons**: Use SM size (16px) for button icons
- **Navigation**: Use MD size (20px) for navigation icons
- **Hero Cards**: Use 2XL size (48px) for hero attribute icons
- **Performance**: Use LG size (24px) for performance indicators

## Icon Spacing Standards

### **Padding Guidelines**
- **Inline Icons**: No additional padding
- **Button Icons**: `p-1` (4px) padding
- **Card Icons**: `p-2` (8px) padding
- **Hero Icons**: `p-3` (12px) padding

### **Margin Guidelines**
- **Icon + Text**: `mr-2` (8px) margin-right
- **Text + Icon**: `ml-2` (8px) margin-left
- **Icon Groups**: `space-x-2` (8px) between icons

## Icon Color Standards

### **Theme Support**
- **Light Theme**: Use semantic colors from color palette
- **Dark Theme**: Use semantic colors with dark variants
- **High Contrast**: Ensure sufficient contrast ratios

### **Semantic Colors**
- **Primary**: `text-blue-600 dark:text-blue-400`
- **Success**: `text-green-600 dark:text-green-400`
- **Warning**: `text-yellow-600 dark:text-yellow-400`
- **Error**: `text-red-600 dark:text-red-400`
- **Info**: `text-blue-600 dark:text-blue-400`
- **Neutral**: `text-gray-600 dark:text-gray-400`

### **State Colors**
- **Active**: `text-blue-600 dark:text-blue-400`
- **Inactive**: `text-gray-400 dark:text-gray-500`
- **Hover**: `text-blue-700 dark:text-blue-300`
- **Disabled**: `text-gray-300 dark:text-gray-600`

## Accessibility Guidelines

### **ARIA Labels**
- **Required**: All icons must have `aria-label` or `aria-labelledby`
- **Descriptive**: Labels should describe the icon's purpose
- **Context**: Include context in labels when needed

### **Screen Reader Support**
- **Decorative Icons**: Use `aria-hidden="true"`
- **Functional Icons**: Use proper ARIA labels
- **Interactive Icons**: Include role and state information

### **Focus Indicators**
- **Interactive Icons**: Must have visible focus indicators
- **Focus Order**: Logical tab order for icon groups
- **Keyboard Navigation**: All interactive icons must be keyboard accessible

### **Color Contrast**
- **WCAG 2.1 AA**: Minimum 4.5:1 contrast ratio for normal text
- **Large Icons**: Minimum 3:1 contrast ratio for large icons
- **Testing**: Test with color blindness simulators

## Implementation Guidelines

### **Custom Icon Components**

```tsx
// Custom Dota 2 icon component
interface CustomIconProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  color?: string;
  'aria-label'?: string;
}

export const DotabuffIcon: React.FC<CustomIconProps> = ({ 
  className = "w-5 h-5",
  'aria-label': ariaLabel = "Dotabuff icon"
}) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    role="img"
    aria-label={ariaLabel}
  >
    {/* SVG content */}
  </svg>
);
```

### **Lucide Icon Usage**

```tsx
// Lucide icon component
import { LucideIcon } from 'lucide-react';

interface LucideIconProps {
  icon: LucideIcon;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  color?: string;
  'aria-label'?: string;
}

export const Icon: React.FC<LucideIconProps> = ({ 
  icon: IconComponent,
  className = "w-5 h-5",
  'aria-label': ariaLabel
}) => (
  <IconComponent
    className={className}
    aria-label={ariaLabel}
    role="img"
  />
);
```

### **Icon with Text**

```tsx
// Icon with text component
interface IconTextProps {
  icon: React.ReactNode;
  text: string;
  className?: string;
}

export const IconText: React.FC<IconTextProps> = ({ 
  icon, 
  text, 
  className = "" 
}) => (
  <span className={`inline-flex items-center ${className}`}>
    {icon}
    <span className="ml-2">{text}</span>
  </span>
);
```

## Usage Examples

### **Navigation Icons**
```tsx
// Sidebar navigation
<nav className="space-y-2">
  <a href="/" className="flex items-center p-2 hover:bg-gray-100">
    <Icon icon={Home} className="w-5 h-5 mr-3" aria-label="Dashboard" />
    Dashboard
  </a>
  <a href="/team-management" className="flex items-center p-2 hover:bg-gray-100">
    <Icon icon={Users} className="w-5 h-5 mr-3" aria-label="Team Management" />
    Team Management
  </a>
</nav>
```

### **Action Buttons**
```tsx
// Action button with icon
<button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded">
  <Icon icon={Plus} className="w-4 h-4 mr-2" aria-label="Add" />
  Add Team
</button>
```

### **Status Indicators**
```tsx
// Status indicator
<div className="flex items-center">
  <Icon 
    icon={CheckCircle} 
    className="w-5 h-5 text-green-600" 
    aria-label="Success" 
  />
  <span className="ml-2 text-green-600">Operation completed</span>
</div>
```

### **Hero Attribute Icons**
```tsx
// Hero attribute display
<div className="flex items-center">
  <StrengthIcon className="w-6 h-6 text-red-600" />
  <span className="ml-2 capitalize">Strength</span>
</div>
```

## Best Practices

### **Icon Selection**
- **Consistency**: Use the same icon for the same action across the app
- **Clarity**: Choose icons that clearly represent their function
- **Context**: Consider the context when selecting icons
- **Culture**: Be aware of cultural differences in icon meaning

### **Implementation**
- **Performance**: Use SVG icons for better performance
- **Scalability**: Ensure icons scale well at different sizes
- **Accessibility**: Always include proper ARIA labels
- **Testing**: Test icons with screen readers and keyboard navigation

### **Maintenance**
- **Documentation**: Keep icon usage documented
- **Consistency**: Regular reviews of icon usage
- **Updates**: Update icons when design system changes
- **Deprecation**: Properly deprecate unused icons

## Icon Library Management

### **Custom Icons**
- **Location**: `src/components/icons/`
- **Naming**: PascalCase with "Icon" suffix
- **Export**: Named exports for each icon
- **Testing**: Unit tests for each custom icon

### **Lucide Icons**
- **Import**: Import from `lucide-react`
- **Bundle**: Tree-shake unused icons
- **Version**: Keep Lucide version updated
- **Customization**: Use consistent styling approach

### **Icon Registry**
- **Documentation**: Maintain list of all available icons
- **Categories**: Organize icons by function
- **Search**: Provide searchable icon index
- **Examples**: Include usage examples for each icon

## Quality Assurance

### **Accessibility Testing**
- [ ] All icons have proper ARIA labels
- [ ] Icons are keyboard accessible
- [ ] Screen reader compatibility verified
- [ ] Color contrast meets WCAG standards

### **Visual Testing**
- [ ] Icons render correctly at all sizes
- [ ] Icons work in light and dark themes
- [ ] Icons maintain clarity at small sizes
- [ ] Icons are consistent across browsers

### **Performance Testing**
- [ ] Icon bundle size is optimized
- [ ] Icons load quickly
- [ ] No layout shift when icons load
- [ ] Icons scale smoothly

This comprehensive icon system documentation ensures consistent, accessible, and maintainable icon usage throughout the Dota 2 data dashboard application, using only custom icons and Lucide icons with a clear process for creating new custom icons when needed. 