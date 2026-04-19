# Frontend Development Workflow

---

## C3 Look & Feel Guidelines

The application uses the **C3 Design System** — a set of CSS custom properties (tokens) exposed via Tailwind utility classes. All new UI must use these tokens instead of hardcoded colors, radii, or spacing values.

### Design Token Files

| File                                 | Purpose                                                                                                   |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `src/c3ui/c3FoundationTokens.css`    | Primitive palette: gray-05→100, blue, green, red, yellow, decorative colors, shadows, spacing, typography |
| `src/c3ui/c3SemanticTokensLight.css` | Light-mode semantic tokens (mapped to `:root`)                                                            |
| `src/c3ui/c3SemanticTokensDark.css`  | Dark-mode semantic tokens (mapped to `.dark`)                                                             |
| `src/tailwind/c3TailwindTheme.css`   | Tailwind v4 `@theme` block — maps all C3 tokens to Tailwind utility class names (not imported in v3 builds) |
| `src/tailwind/c3CustomUtilities.css` | Tailwind v4 `@utility` definitions (not imported in v3 builds)                                            |
| `src/c3ui/c3RootSemanticMapping.css` | v3 bridge: same mappings as `@theme`, declared on `:root` so PostCSS accepts them                          |
| `src/c3ui/c3UtilitiesV3.css`         | v3 `@layer` utilities + base form styles, generated from the v4 custom utilities pattern                   |

**Reference implementation (Tailwind v4, full pipeline):** `c3genesis` — `repo/genesis/ui/react/src/globals.css` (imports, `@custom-variant dark`, scrollbar/button defaults, mobile type scale). On this machine that tree often lives at `/Users/tonycho/C3/c3genesis`.

### Page Shell

Every page uses the same outer structure:

```tsx
<div className="h-full bg-secondary flex flex-col">
  <PageHeader title={...} icon={LucideIcon} />
  <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
    {/* content */}
  </div>
</div>
```

- **Outer container**: `h-full bg-secondary flex flex-col`
- **Scrollable body**: `flex-1 overflow-y-auto px-4 md:px-8 py-6` (match `PageHeader` horizontal padding; add `max-w-* mx-auto` when constraining width)
- Use `space-y-6` between top-level sections
- Never use a centered page-level spinner — use inline skeleton loaders instead

**Map + fixed sidebar (Dashboard):** Put **`PageHeader` only inside the left column** so the title row does not span the sidebar. Use a **`flex-1` row** below **`AppTopNav`** with **`items-stretch`**: left column holds header + scrollable map stack; right sidebar uses **`self-stretch`**, **no outer `py-*`**, so the sidebar band runs **flush top-to-bottom** in that row.

### PageHeader Component

```tsx
import { PageHeader } from '../../components/PageHeader/PageHeader';

<PageHeader
  title="My Page"
  subtitle="Optional description" // renders below title in text-sm text-secondary
  icon={SomeLucideIcon}
  iconColor="text-secondary" // optional; default text-secondary
  iconSize={24} // optional Lucide size
  contentWrapperClassName="w-full min-w-0 px-4 md:px-8" // optional; align with page body
  rightContent={<div>...</div>} // slot for filters, buttons, etc.
/>;
```

- Container: `bg-secondary py-6` (horizontal padding on inner wrapper, default `px-4 md:px-8` — same rhythm as c3genesis `PageHeader`)
- Title: `text-2xl font-medium text-primary` with icon (default `text-secondary`, size 24)
- Subtitle: `text-sm text-secondary mt-1 max-w-3xl`

### Cards

The **standard card** in this app is:

```tsx
<div className="bg-primary border border-weak rounded-sm p-4">{/* content */}</div>
```

- **Always** use `rounded-sm` for C3 surfaces — avoid `rounded-lg` on cards. In this repo, `tailwind.config.js` maps **`rounded-md` to the same `--radius-sm` token** as `rounded-sm`, so older `rounded-md` controls still match C3 corner radius.
- **Card outlines:** prefer **`border-gray-100`** (core gray-20) for a light edge on white cards; reserve **`border-weak`** for stronger separation (still semantic, not raw hex).
- **Never** use inline `style={{ backgroundColor: ... }}` for card backgrounds — use token classes

The `c3-card` Tailwind utility provides the same defaults (card background, border-weak, rounded-sm, padding-04). Prefer it for standalone cards:

```tsx
<div className="c3-card">...</div>
```

### Section Headings Inside Pages

Match the **Settings page** pattern — `text-sm font-semibold text-primary` with an optional subtitle below:

```tsx
<section className="mb-8">
  <h2 className="text-sm font-semibold text-primary mb-1">{t('Section.title')}</h2>
  <p className="text-xs text-secondary mb-4">{t('Section.description')}</p>
  {/* section content */}
</section>
```

- Title: `text-sm font-semibold text-primary mb-1`
- Optional subtitle: `text-xs text-secondary mb-4`
- Do **not** use `uppercase`, `tracking-wide`, or `text-secondary` on section headings — those styles are for card-level labels inside `StatCard`, not page section titles.

### Stat / Summary Cards

Use the existing `StatCard` component for any key metric display:

```tsx
import StatCard from '../../components/StatCard/StatCard';

// Wrap in a card shell, then place StatCard inside:
<div className="flex-1 min-w-[120px] bg-primary border border-weak rounded-sm">
  <StatCard
    label="Total Tokens"
    value={formatNumber(totalTokens)}
    colorVariant="accent" // accent | success | warning | danger | primary | info | tertiary
    subtitle="optional sub-text"
  />
</div>;
```

Color variant → semantic meaning:

- `accent` — primary metric / blue highlight
- `success` — positive / green
- `warning` — caution / amber
- `danger` — error / red
- `primary` — neutral / gray text
- `info` — informational (also blue)
- `tertiary` — de-emphasized

### Color: Never Hardcode Hex or Arbitrary Values

**Wrong:**

```tsx
<span style={{ color: '#8b5cf6' }}>value</span>
<div style={{ backgroundColor: '#1f2937' }}>...</div>
<div className="bg-[#8b5cf6] text-[#1f2937]">...</div>
```

**Correct — use semantic Tailwind classes:**

```tsx
<span className="text-accent">value</span>
<div className="bg-primary">...</div>
```

This applies everywhere: JSX class names, inline `style` props, and ECharts/chart config objects.

**Full semantic color class reference:**

| Class             | Light value | Dark value |
| ----------------- | ----------- | ---------- |
| `text-primary`    | gray-95     | gray-05    |
| `text-secondary`  | gray-65     | gray-45    |
| `text-accent`     | blue-60     | blue-40    |
| `text-success`    | green-60    | green-40   |
| `text-warning`    | yellow-50   | yellow-40  |
| `text-danger`     | red-60      | red-40     |
| `bg-primary`      | white       | gray-100   |
| `bg-secondary`    | gray-05     | gray-95    |
| `bg-tertiary`     | gray-10     | gray-90    |
| `bg-accent`       | blue-60     | blue-40    |
| `bg-accent-weak`  | blue-05     | blue-95    |
| `bg-success-weak` | green-05    | green-95   |
| `bg-warning-weak` | yellow-05   | yellow-95  |
| `bg-danger-weak`  | red-05      | red-95     |
| `border-weak`     | gray-30     | gray-70    |
| `border-primary`  | gray-60     | gray-40    |
| `border-accent`   | blue-60     | blue-40    |

### Border Radius

**The C3 design system uses very small radii. Never use `rounded-md`, `rounded-lg`, or `rounded-xl` on interactive controls or cards.**

| Token          | Value  | Use for                                                      |
| -------------- | ------ | ------------------------------------------------------------ |
| `rounded-xs`   | 2px    | Buttons, inputs, selects, dropdowns, filter triggers, badges |
| `rounded-sm`   | 4px    | Cards, panels, chart containers, table wrappers, modals      |
| `rounded-full` | 9999px | Progress bar fills, avatar circles, status dots only         |

**Wrong:**

```tsx
<button className="rounded-md ...">Save</button>
<input className="rounded-lg ..." />
<div className="rounded-xl ...">Card</div>
```

**Correct:**

```tsx
<button className="rounded-xs ...">Save</button>
<input className="rounded-xs ..." />
<div className="rounded-sm ...">Card</div>
```

This applies to every interactive element: buttons, `<input>`, `<select>`, `<textarea>`, dropdown trigger buttons, dropdown panels, search inputs, and filter controls.

### Progress Bars

```tsx
<div className="w-full h-1 rounded-full bg-tertiary overflow-hidden">
  <div
    className={`h-full rounded-full transition-all duration-300 ${isOver ? 'bg-danger' : 'bg-accent'}`}
    style={{ width: `${pct}%` }}
  />
</div>
```

Valid fill classes: `bg-accent`, `bg-success`, `bg-warning`, `bg-danger`

### Segmented Period / Tab Controls

Use `SlidingSegmentedControl` instead of raw `<select>` for short option sets (≤6 items):

```tsx
import {
  SlidingSegmentedControl,
  SlidingSegmentedControlOption,
} from '../../components/SlidingSegmentedControl/SlidingSegmentedControl';

const OPTIONS: SlidingSegmentedControlOption<string>[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];

<SlidingSegmentedControl options={OPTIONS} value={period} onChange={setPeriod} />;
```

For longer lists, use the native `<select>` with C3 styling:

```tsx
<select className="h-[28px] pl-3 pr-8 text-sm border border-weak rounded-xs bg-primary text-primary focus:outline-none focus:border-accent cursor-pointer">
```

### Buttons

| Variant              | Classes                                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| Primary (filled)     | `px-4 py-2 text-sm font-medium text-inverse bg-accent rounded-xs hover:opacity-80 transition-opacity`       |
| Small primary        | `px-3 py-1.5 text-xs font-medium text-inverse bg-accent rounded-xs hover:opacity-80 transition-opacity`     |
| Secondary (outlined) | `px-4 py-2 text-sm font-medium text-primary border border-weak rounded-xs hover:bg-hover transition-colors` |
| Danger               | `px-4 py-2 text-sm font-medium text-inverse bg-danger rounded-xs hover:opacity-80 transition-opacity`       |
| Ghost / link         | `text-xs font-medium text-accent hover:text-accent-hover`                                                   |
| Icon button          | `p-1.5 rounded-xs text-secondary hover:bg-hover hover:text-primary transition-colors`                       |

- Border radius: always `rounded-xs` on buttons (not `rounded-md`, `rounded-lg`)
- Icons inside buttons: use Lucide icons, `size={14}` for small buttons, `size={16}` for normal

### Modals and Dialogs

Always use the shared `Modal` component — never build bespoke overlay `<div>` dialogs:

```tsx
import { Modal } from '../../components/Modal/Modal';

<Modal
  open={isOpen}
  onClose={handleClose} // called on Esc, backdrop click, and X button
  title="Dialog Title" // text-xl font-semibold, consistent across app
  cancelButton={{ onClick: handleClose }}
  primaryButton={{ text: 'Save', onClick: handleSave, loading: saving }}
>
  {/* form fields */}
</Modal>;
```

Using `Modal` gives you for free: Esc key dismiss, backdrop click dismiss, `FocusTrap`, portal rendering, consistent title typography, and X close button. For custom footer buttons (e.g. green approve / red reject), use `customFooter` prop.

### Filter Row Pattern

```tsx
<div className="flex flex-wrap items-center gap-2 pb-4 border-b border-weak">
  <SlidingSegmentedControl ... />
  <SearchableMultiSelect ... />
  <SearchableMultiSelect ... />
</div>
```

Always add `border-b border-weak pb-4` to visually separate filters from content below.

### Charts (ECharts)

Use `echarts-for-react` (`ReactECharts`) for time-series and stacked bar charts.

**Critical:** Derive all chart colors from C3 CSS tokens at render time — never hardcode hex:

```tsx
import { useTheme } from '../../hooks/useTheme';

const { currentTheme } = useTheme();
const isDark = currentTheme === 'dark';

const chartColors = useMemo(() => {
  const style = getComputedStyle(document.documentElement);
  const get = (v: string) => style.getPropertyValue(v).trim() || v;
  return {
    accent: get('--c3-style-accentColor'), // blue
    success: get('--c3-style-successColor'), // green
    warning: get('--c3-style-warningColor'), // amber
    danger: get('--c3-style-dangerColor'), // red
    axisLabel: get('--c3-style-colorFgSecondary'),
    splitLine: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
    tooltipBg: isDark ? get('--c3-style-colorBgSecondary') : get('--c3-style-colorBgPrimary'),
    tooltipBorder: get('--c3-style-colorBorderWeak'),
    tooltipText: get('--c3-style-colorFgPrimary'),
  };
}, [isDark]);
```

Wrap charts in the standard card:

```tsx
<section className="bg-primary border border-weak rounded-sm p-4">
  <h2 className="text-xs font-medium text-secondary uppercase tracking-wide mb-4">Chart Title</h2>
  <ReactECharts option={chartOption} style={{ height: 320 }} notMerge />
</section>
```

### Loading Skeletons

Never use a full-page centered spinner. Use inline `animate-pulse` placeholders:

```tsx
// Stat card skeletons
<div className="flex flex-wrap gap-3">
  {Array.from({ length: 4 }).map((_, i) => (
    <div key={i} className="flex-1 min-w-[120px] bg-primary border border-weak rounded-sm p-4 h-20 animate-pulse" />
  ))}
</div>

// Chart skeleton
<div className="bg-primary border border-weak rounded-sm p-4">
  <div className="h-4 w-32 bg-tertiary rounded animate-pulse mb-4" />
  <div className="h-[320px] bg-tertiary rounded animate-pulse" />
</div>

// Table row skeletons
<div className="space-y-2">
  {Array.from({ length: 5 }).map((_, i) => (
    <div key={i} className="h-11 bg-primary border border-weak rounded-sm animate-pulse" />
  ))}
</div>
```

### Empty States

```tsx
<div className="bg-primary border border-weak rounded-sm flex items-center justify-center py-16 text-sm text-secondary">
  No data available.
</div>
```

### Typography Summary

| Use                     | Class                                          |
| ----------------------- | ---------------------------------------------- |
| Page title              | `text-2xl font-medium text-primary`            |
| Section heading         | `text-sm font-semibold text-primary`           |
| Card label / stat label | `text-sm text-secondary font-medium uppercase` |
| Large metric value      | `text-2xl font-semibold`                       |
| Body / description      | `text-sm text-secondary`                       |
| Caption / meta          | `text-xs text-secondary`                       |
| Code                    | `font-mono text-sm`                            |

### Grid Layouts for Stat Cards

```tsx
// Flowing wrap (variable count)
<div className="flex flex-wrap gap-3">
  <div className="flex-1 min-w-[120px] bg-primary border border-weak rounded-sm">
    <StatCard ... />
  </div>
</div>

// Fixed columns with dividers (Operator-style)
<div className="bg-primary border border-weak rounded-sm grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-weak">
  <StatCard label="Total" value="1.2M" colorVariant="accent" />
  <StatCard label="Input" value="800K" colorVariant="primary" />
</div>
```

### Existing Shared Components — Use These, Don't Reinvent

| Component                            | Path                                             | Use for                                                             |
| ------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------- |
| `PageHeader`                         | `components/PageHeader/`                         | Every page's title bar                                              |
| `StatCard`                           | `components/StatCard/`                           | Metric / KPI cards                                                  |
| `Modal`                              | `components/Modal/`                              | All dialogs — gets Esc, backdrop click, FocusTrap, consistent title |
| `AppCard`                            | `components/Card/`                               | Entity card with thumbnail                                          |
| `SlidingSegmentedControl`            | `components/SlidingSegmentedControl/`            | Tab/option pickers (≤6 items)                                       |
| `SearchableMultiSelect`              | `components/SearchableMultiSelect/`              | Multi-select filter dropdowns                                       |
| `SearchableSelect`                   | `components/SearchableSelect/`                   | Single-select filter dropdowns                                      |
| `SearchInput`                        | `components/SearchInput/`                        | Text search input                                                   |
| `StatusDot`                          | `components/StatusDot/`                          | Colored status indicator dot                                        |
| `Tooltip`                            | `components/Tooltip/`                            | Hover tooltips                                                      |
| `BarSkeleton`, `TableSkeleton`, etc. | `components/LoadingStates/`                      | Loading placeholders                                                |
| `Banner`                             | `components/Banner/`                             | Toast / notification banners                                        |
| `DestructiveActionConfirmationModal` | `components/DestructiveActionConfirmationModal/` | Delete confirmations                                                |
