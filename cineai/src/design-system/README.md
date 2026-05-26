# CINE AI - PREMIUM DESIGN SYSTEM

## Overview

This is a **production-grade, premium design system** for the Cine AI mobile application. It serves as the **single source of truth** for all design decisions, ensuring:

- **Total consistency** across the entire app
- **Premium quality** in every interaction
- **Cinematic atmosphere** throughout
- **World-class standards** globally competitive
- **Zero "kaam chalu" design** — everything is intentional

## Philosophy

The design system is built on a **luxury cafe atmosphere** concept:

- **Warm** ambient lighting (dark OLED palette)
- **Elegant** surfaces and compositions
- **Emotional** depth and storytelling
- **Cinematic** pacing and motion
- **Premium** interactions and feedback
- **Intentional** typography and hierarchy

## Architecture

The design system is organized into **17 foundational systems**:

```
src/design-system/
├── colors/                  # Premium OLED palette
├── typography/              # Outfit + Inter hierarchy
├── spacing/                 # Breathing room system
├── motion/                  # Spring physics & timing
├── shadows/                 # Cinematic lighting
├── gradients/               # Hero & overlay effects
├── surfaces/                # Glass, cards, modals
├── blur/                    # Frosting & backdrop
├── icons/                   # Icon system & states
├── haptics/                 # Tactile feedback
├── layout/                  # Screen & content patterns
├── borders/                 # Radius & geometry
├── opacity/                 # Transparency levels
├── radius/                  # Corner radius scales
├── animation-presets/       # Motion patterns
├── accessibility/           # WCAG compliance
├── themes/                  # Complete theme object
└── index.ts                 # Main export hub
```

## Quick Start

### Import the Theme

```typescript
import theme from '@/design-system';
// or
import { colors, spacing, motion } from '@/design-system';
```

### Use Colors

```typescript
import { colors } from '@/design-system';

<View style={{ backgroundColor: colors.backgrounds.deep }}>
  <Text style={{ color: colors.text.primary }}>Premium Text</Text>
</View>
```

### Use Typography

```typescript
import { typography } from '@/design-system';

<Text style={typography.heading.xl}>Screen Title</Text>
<Text style={typography.body.md}>Body text goes here</Text>
```

### Use Spacing

```typescript
import { spacing } from '@/design-system';

<View style={{ 
  padding: spacing.layout.screenEdge,
  marginBottom: spacing.section.lg 
}}>
  Content
</View>
```

### Use Motion

```typescript
import { motion } from '@/design-system';

const animation = Animated.timing(value, {
  toValue: 1,
  duration: motion.timings.standard,
  easing: Easing.bezier(...motion.easings.easeOut),
  useNativeDriver: true,
});
```

### Use Shadows

```typescript
import { shadows } from '@/design-system';

<View style={shadows.componentShadows.card}>
  Card content
</View>
```

## Core Systems Explained

### Colors System

**OLED-First Premium Palette:**

```typescript
// Backgrounds - Warm Black
#09090B  // Deepest - foundation
#0C0C14  // Deep - main
#111114  // Elevated - surfaces

// Accents - Emotional
#F59E0B  // Warm Amber - primary
#7C3AED  // Royal Purple - secondary  
#3B82F6  // Electric Blue - tertiary

// Semantic
#10B981  // Success
#DC2626  // Error
#F59E0B  // Warning
```

**Usage:**
- Never use random colors
- Always use semantic tokens
- Combine with opacity for depth

### Typography System

**Two Premium Fonts:**

- **Outfit** - Display, headings (expensive, editorial)
- **Inter** - Body, metadata (readable, professional)

**Hierarchy Levels:**

- `display` - Maximum impact (28-48px)
- `heading` - Section titles (16-24px)
- `body` - Main content (13-16px)
- `metadata` - Supporting text (11-14px)
- `conversational` - AI chat (14-15px)

**Rule:** Never set arbitrary font sizes. Use defined styles.

### Spacing System

**Philosophy:** Create breathing room and calm.

- `micro` - Fine details (2-12px)
- `component` - UI elements (padding/margins)
- `section` - Content flow (12-40px)
- `layout` - Screen-level (16-32px)
- `safeArea` - System-aware positioning
- `grid` - Carousel & list spacing
- `hero` - Featured content

**Rule:** Spacing creates composition. Use scales, not random values.

### Motion System

**Spring Physics-Based:**

- `springs` - Damping + mass configs
- `timings` - Duration presets (100-1000ms)
- `easings` - Bezier curves for personality
- `transitions` - Named motion patterns
- `aiBehavior` - Orb & AI animations
- `keyboard` - Composer choreography

**Philosophy:**
- Physically believable
- Emotionally paced
- Restrained & premium

**Rule:** Motion supports emotion, never distracts.

### Shadows System

**Cinematic Lighting:**

- `softShadows` - Subtle depth (xs-md)
- `elevatedShadows` - Prominent elevation (sm-lg)
- `cinematicShadows` - Dramatic depth
- `glowEffects` - Warm ambient lighting
- `componentShadows` - Pre-configured shadows

**Philosophy:** UI should feel "lit", not "decorated".

### Surfaces System

**Pre-Built Surface Definitions:**

- `glassSurfaces` - Blur + transparency
- `elevatedSurfaces` - Depth layers
- `cardSurfaces` - Content containers
- `floatingSurfaces` - Composers & FABs
- `modalSurfaces` - Overlays
- `interactiveSurfaces` - Buttons & inputs

**Usage:**
```typescript
<View style={surfaces.glassSurfaces.standard}>
  Premium content
</View>
```

### Icons System

**Complete Icon Organization:**

- `sizes` - 16-64px scale
- `colors` - Primary to semantic
- `families` - Navigation, action, media, status
- `states` - Default, hover, pressed, active, disabled
- `animations` - Spin, pulse, bounce

### Haptics System

**Tactile Feedback Categories:**

- `interactionHaptics` - Button, selection, scroll
- `aiHaptics` - Thinking, response, success
- `confirmationHaptics` - Success, error, warning
- `modalHaptics` - Modal appear/dismiss
- `compositionHaptics` - Message send, keyboard
- `gestureHaptics` - Swipe, long press, pinch

### Motion Presets

**Pre-Built Animation Patterns:**

- `componentAnimations` - Fade, scale, slide
- `screenAnimations` - Push, pop, fade
- `modalAnimations` - Appear, disappear
- `aiAnimations` - Breathing, pulses, reveals
- `ambientAnimations` - Floating, glowing
- `loadingAnimations` - Spinner, shimmer

### Accessibility System

**WCAG AAA Compliance:**

- Color contrast ratios verified
- Minimum touch targets (44px)
- Focus indicators defined
- Motion preferences respected
- Screen reader support

## Design Principles

### 1. Never Hardcode Values

❌ **BAD:**
```typescript
<View style={{ padding: 16, marginBottom: 24 }}>
```

✅ **GOOD:**
```typescript
import { spacing } from '@/design-system';
<View style={{ 
  padding: spacing.layout.screenEdge,
  marginBottom: spacing.section.lg 
}}>
```

### 2. Use Semantic Tokens

❌ **BAD:**
```typescript
color: '#FF0000'
```

✅ **GOOD:**
```typescript
color: colors.semantic.error
```

### 3. Consistent Spacing Rhythm

Create visual hierarchy through spacing, not just size.

### 4. Spring Physics Over Easing

Prefer `springs` over arbitrary timing functions for more natural feel.

### 5. Typography Carries Emotion

Choose font styles intentionally. Typography is hierarchy.

### 6. Shadows Create Depth

Use shadows for elevation, not visual noise.

### 7. Motion Supports Composition

Every animation should serve the experience, not distract from it.

## Component Development Guidelines

### When Building Components

1. **Import design system**
   ```typescript
   import { colors, spacing, typography, motion } from '@/design-system';
   ```

2. **Use semantic tokens**
   ```typescript
   <View style={{
     backgroundColor: colors.surfaces.level1,
     padding: spacing.component.cardPadding.vertical,
     borderRadius: radius.components.card,
   }}>
   ```

3. **Define motion with springs**
   ```typescript
   Animated.spring(value, motion.springs.standard).start();
   ```

4. **Leverage shadows for depth**
   ```typescript
   style={shadows.componentShadows.card}
   ```

5. **Use accessibility standards**
   ```typescript
   accessibilityLabel="Descriptive label"
   accessibilityRole="button"
   minHeight={accessibility.touchTargets.minimum}
   ```

## Modification & Extension

### Adding New Tokens

Edit the relevant system file (e.g., `colors/index.ts`):

```typescript
// colors/index.ts
export const newColor = '#ABC123';  // ✅ Add with semantic meaning
```

### Creating Custom Surfaces

```typescript
// surfaces/index.ts
export const customSurface = {
  backgroundColor: colors.surfaces.level2,
  borderRadius: radius.components.card,
  // ... other properties
};
```

### Adding Animation Presets

```typescript
// animation-presets/index.ts
export const customAnimations = {
  myAnimation: {
    type: 'spring',
    duration: motion.timings.moderate,
    // ...
  }
};
```

## Performance Considerations

- Use **memoization** for theme hooks
- Leverage **GPU transforms** (translateX, translateY, scale, rotate)
- Avoid **excessive blur** (limits performance)
- Use **virtualization** for long lists
- Respect **reduced motion** preferences

## Accessibility Checklist

- [ ] Color contrast ratios meet WCAG AA minimum (4.5)
- [ ] Touch targets are minimum 44x44
- [ ] All interactive elements have focus indicators
- [ ] Haptic feedback provides non-visual feedback
- [ ] Screen reader labels are descriptive
- [ ] Motion respects `prefers-reduced-motion`
- [ ] Text is resizable

## Testing the Design System

### Color Contrast Verification
```typescript
import { accessibility } from '@/design-system';
// Verify ratio >= accessibility.contrastRatios.aa
```

### Spacing Consistency
Ensure all spacing uses system tokens, not arbitrary values.

### Motion Performance
Test 60FPS on mid-range devices.

### Accessibility
Run through accessibility audit tools.

## Future Enhancements

- Dynamic theme switching (light/dark)
- Tablet-optimized breakpoints
- Additional language typography support
- RTL language support
- Theme customization hooks

## Reference

- **Design System Version:** 2.0.0
- **Framework:** React Native (Expo SDK 50)
- **Fonts:** Outfit, Inter
- **Color Palette:** OLED-optimized
- **Motion Engine:** Reanimated
- **Accessibility:** WCAG AAA

## Support & Questions

For design system questions or additions, refer to `.prompt.md` for the complete reconstruction mandate.
