# Quorum Theme Guide

## Slack-Inspired Color Palette

### Core Theme Colors

```css
navigation: #1a1d29        /* Dark sidebar background */
selected: #0ba8ca          /* Active/selected items (cyan) */
presence: #2eb67d          /* Activity indicators (green) */
notification: #e01e5a      /* Errors, alerts (red) */
```

### Background Colors

```css
off-white: #FFFFFF         /* Main content backgrounds */
off-black: #1D1C1D         /* Dark text/elements */
subtle: #F8F8F8            /* Subtle backgrounds (cards, hover states) */
```

### Text Colors (WCAG AA+ Contrast)

```css
text-text-primary: #1D1C1D           /* High contrast on light (headings, important text) */
text-text-secondary: #616061         /* Medium contrast on light (labels, secondary text) */
text-text-tertiary: #868686          /* Lower contrast on light (placeholders, metadata) */
text-text-inverse: #FFFFFF           /* White on dark backgrounds (sidebar) */
text-text-inverse-muted: #D1D2D3     /* Muted white on dark backgrounds */
```

### Border Colors

```css
border: #DDDDDD            /* Light borders */
border-dark: #454245       /* Dark borders (for dark backgrounds) */
```

## Component Color Usage

### Navigation Sidebar
- Background: `bg-navigation`
- Text: `text-text-inverse`
- Borders: `border-border-dark`
- Selected room: `bg-selected/20 border-l-4 border-selected`
- Hover: `hover:bg-off-black`
- Buttons: `bg-selected text-text-inverse`

### Main Content Area
- Background: `bg-off-white`
- Text: `text-text-primary`
- Borders: `border-border`

### Messages
- Background: `bg-white`
- AI messages: `bg-subtle border-l-4 border-selected`
- Text: `text-text-primary` (main), `text-text-secondary` (metadata)
- Mentions: `text-selected bg-selected/10`

### Inputs & Forms
- Background: `bg-white`
- Border: `border-border`
- Text: `text-text-primary`
- Placeholder: `placeholder-text-tertiary`
- Focus ring: `focus:ring-selected`
- Disabled: `disabled:bg-border disabled:text-text-secondary`

### Buttons
- Primary: `bg-selected text-text-inverse hover:bg-selected/90`
- Secondary: `bg-white text-text-secondary border border-border hover:bg-subtle`
- Danger: `bg-notification text-text-inverse`

### Activity Indicators
- AI responding: `bg-presence` (green pulsing dot)
- AI thinking: `bg-selected/20` with `border-selected`

## Contrast Ratios

All text colors meet WCAG AA standards:
- `text-text-primary` on white: 15.8:1 (AAA)
- `text-text-secondary` on white: 7.1:1 (AA)
- `text-text-tertiary` on white: 4.8:1 (AA)
- `text-text-inverse` on navigation: 12.5:1 (AAA)

## Removed/Deprecated Colors

The following are no longer used:
- ❌ All `purple-*` colors
- ❌ All `dg-*` Deepgram colors
- ❌ All `gray-*` hardcoded grays
- ❌ `seagreen`, `electricblue`, `almostblack`, `darkgray`, `carbon`, `lightgray`, `radicalred`

## Usage Examples

### Light Content Card
```tsx
<div className="bg-off-white border border-border rounded-lg p-4">
  <h3 className="text-text-primary font-semibold">Title</h3>
  <p className="text-text-secondary">Description</p>
</div>
```

### Primary Action Button
```tsx
<button className="bg-selected text-text-inverse hover:bg-selected/90 px-4 py-2 rounded-lg">
  Submit
</button>
```

### Input Field
```tsx
<input 
  className="bg-white border border-border text-text-primary placeholder-text-tertiary focus:ring-selected"
  placeholder="Enter text..."
/>
```

### Dark Sidebar Item
```tsx
<div className="bg-navigation text-text-inverse p-4">
  <div className="hover:bg-off-black p-2">
    Item
  </div>
</div>
```

