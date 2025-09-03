# Frontend Show Pattern

## Philosophy

The Frontend Show pattern provides a reusable, accessible, and performant way to display detailed entity information in Laravel + Inertia + React applications. It emphasizes:

- **Progressive Disclosure**: Load heavy data only when needed using tabs
- **Accessibility**: WAI-ARIA compliant components with keyboard navigation
- **Performance**: Partial reloads to minimize data transfer
- **Responsiveness**: Adaptive layouts for mobile and desktop
- **Reusability**: Base components that can be extended for any entity

## Architecture

### Core Components

#### 1. ShowLayout (`components/show-base/ShowLayout.tsx`)

Provides the responsive grid structure with:

- Header area with back navigation and title
- Actions area for edit/delete buttons
- Main content area (8 cols on desktop)
- Sticky aside area (4 cols on desktop)
- Skip-to-content link for accessibility

#### 2. ShowSection (`components/show-base/ShowSection.tsx`)

Wraps content sections with:

- Section title and ID for anchoring
- Loading state with skeleton UI
- Lazy loading trigger support
- Semantic HTML structure

#### 3. SectionNav (`components/show-base/SectionNav.tsx`)

Provides sticky navigation with:

- Scroll-spy functionality
- Keyboard accessible navigation
- Active section highlighting
- Smooth scrolling with focus management

### Hook

#### useShow (`hooks/use-show.ts`)

Manages show page state with:

- Inertia partial reload integration
- Active tab persistence with `useRemember`
- Loading state management
- Query parameter handling

### Types

#### ShowQuery (`types/ShowQuery.ts`)

TypeScript interfaces for:

- Query parameters (`with`, `withCount`, `append`, `withTrashed`)
- Meta information (`loaded_relations`, `loaded_counts`)
- Response structure

## Usage Example

```tsx
// pages/roles/show.tsx
import { useShow } from '@/hooks/use-show';
import { ShowLayout } from '@/components/show-base/ShowLayout';
import { ShowSection } from '@/components/show-base/ShowSection';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function RoleShow({ item: initialItem, meta: initialMeta }) {
    const { item, meta, loading, activeTab, setActiveTab, loadPart } = useShow({
        endpoint: `/roles/${initialItem.id}`,
        initialItem,
        initialMeta,
    });

    // Load permissions when tab is activated
    const handleTabChange = (value: string) => {
        setActiveTab(value);
        if (value === 'permissions' && !meta.loaded_relations?.includes('permissions')) {
            loadPart({ with: ['permissions'], withCount: ['permissions'] });
        }
    };

    return (
        <ShowLayout header={<h1>{item.name}</h1>} actions={<Button>Edit</Button>} aside={<Card>Summary</Card>}>
            <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="permissions">Permissions</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <ShowSection id="overview" title="Basic Information">
                        {/* Content */}
                    </ShowSection>
                </TabsContent>

                <TabsContent value="permissions">
                    <ShowSection id="permissions" title="Permissions" loading={loading}>
                        {/* Content */}
                    </ShowSection>
                </TabsContent>
            </Tabs>
        </ShowLayout>
    );
}
```

## Best Practices

### Performance

1. **Lazy Load Heavy Data**: Use tabs to defer loading of relationships
2. **Partial Reloads**: Only reload `item` and `meta` props
3. **Preserve State**: Keep scroll position and UI state during reloads
4. **Show Loading States**: Use skeleton placeholders during data fetching

### Accessibility

1. **Skip Links**: Always include skip-to-content link
2. **Focus Management**: Set focus when navigating sections
3. **ARIA Labels**: Use proper labels for navigation and sections
4. **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible
5. **Semantic HTML**: Use proper heading hierarchy and landmarks

### UX Guidelines

1. **Executive Summary**: Place key information in sticky aside
2. **Progressive Disclosure**: Start with overview, load details on demand
3. **Visual Hierarchy**: Use cards and spacing to group related content
4. **Responsive Design**: Stack layout vertically on mobile
5. **Loading Feedback**: Show skeletons or spinners during async operations

## Backend Integration

The frontend Show pattern works with the backend Show pattern:

```php
// Backend Controller
public function show(ShowQuery $query, Role $role)
{
    return Inertia::render('roles/show', [
        'item' => $query->applyToModel($role),
        'meta' => $query->getMeta($role)
    ]);
}
```

Query parameters are automatically handled:

- `?with[]=permissions` - Load permissions relationship
- `?withCount[]=users` - Include users count
- `?append[]=custom_attribute` - Append custom attributes

## Extending the Pattern

To implement for a new entity:

1. **Create the page component** in `pages/[entity]/show.tsx`
2. **Use the base components** (ShowLayout, ShowSection, SectionNav)
3. **Configure the useShow hook** with your endpoint
4. **Define TypeScript interfaces** for your entity
5. **Implement tab change handlers** for lazy loading
6. **Add accessibility features** (skip links, ARIA labels)

## Testing Checklist

- [ ] Partial reloads work correctly
- [ ] Tab state persists across page refreshes
- [ ] Loading states display properly
- [ ] Keyboard navigation functions
- [ ] Skip-to-content link works
- [ ] Responsive layout adapts correctly
- [ ] Scroll-spy highlights active section
- [ ] Focus management works when navigating
- [ ] Screen readers announce content properly
- [ ] Performance metrics are acceptable

## Related Documentation

- [Backend Show Pattern](../backend/show-pattern.md)
- [Accessibility Guidelines](../reference/accessibility.md)
- [Performance Best Practices](../reference/performance.md)
