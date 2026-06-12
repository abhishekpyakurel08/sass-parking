# Color Palette

## Branding Colors

These colors are customizable per tenant through the Branding Management page.

### Primary Color
- **Default**: `#6366f1` (Indigo)
- **Usage**: Main brand color, primary buttons, links
- **CSS Variable**: `--primary`

### Secondary Color
- **Default**: `#1e40af` (Dark Blue)
- **Usage**: Secondary actions, hover states
- **CSS Variable**: `--secondary`

### Accent Color
- **Default**: `#8b5cf6` (Purple)
- **Usage**: Highlights, gradients, decorative elements
- **CSS Variable**: `--accent`

## System Colors

### Success
- **Color**: `#10b981` (Green)
- **Usage**: Success states, positive actions
- **CSS Variable**: `--green`

### Error
- **Color**: `#ef4444` (Red)
- **Usage**: Error states, destructive actions
- **CSS Variable**: `--red`

### Warning
- **Color**: `#f59e0b` (Amber)
- **Usage**: Warning states
- **CSS Variable**: `--orange`

## Dark Mode Colors

### Backgrounds
- **Primary Background**: `#1a1a1a`
- **Secondary Background**: `#2a2a2a`
- **Elevated Background**: `#333333`

### Text
- **Primary Text**: `#ffffff`
- **Secondary Text**: `#888888`
- **Muted Text**: `#666666`

### Borders
- **Border Color**: `#333333`

## Light Mode Colors

### Backgrounds
- **Primary Background**: `var(--bg-card)`
- **Secondary Background**: `var(--bg-elevated)`

### Text
- **Primary Text**: `var(--text)`
- **Secondary Text**: `var(--text-subtle)`
- **Muted Text**: `var(--text-muted)`

### Borders
- **Border Color**: `var(--border)`

## Usage Examples

### Gradient
```css
background: linear-gradient(135deg, #6366f1, #8b5cf6);
```

### Button Styles
```css
background: var(--primary);
color: #ffffff;
```

### Dark Mode Card
```css
background: #1a1a1a;
border: 1px solid #333333;
color: #ffffff;
```
