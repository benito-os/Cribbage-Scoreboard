# Pepper Scorekeeping App - Design Guidelines

## Design Approach: Material Design System
**Rationale:** This is a utility-focused, information-dense application requiring clarity, efficiency, and error prevention. Material Design provides excellent patterns for data display, touch targets, and state management—critical for in-person gameplay around a table.

## Core Design Principles

**Table-Centric Design**
- Large, legible displays visible across a table (minimum 18px body text, 24px+ for scores)
- High contrast ratios for outdoor/varied lighting conditions
- Touch targets minimum 48px for easy tapping during gameplay

**Round-Based Flow**
- Clear separation between setup, active round, and scoring phases
- Prominent "current state" indicators
- One primary action per screen to prevent errors

## Typography System

**Font:** Inter or Roboto via Google Fonts CDN

**Hierarchy:**
- H1 (48px, Bold): Game scores/totals
- H2 (32px, Medium): Round numbers, section headers
- H3 (24px, Medium): Player names, bid values
- Body (18px, Regular): Labels, secondary info
- Small (14px, Regular): Timestamps, metadata

## Layout & Spacing

**Tailwind Spacing Units:** 2, 4, 6, 8, 12, 16
- Standard padding: p-4 for cards, p-6 for sections
- Gaps: gap-4 for lists, gap-6 for major sections
- Margins: mb-8 for section breaks, mb-4 for element separation

**Container Strategy:**
- Mobile-first: max-w-2xl centered
- Full-width score displays
- Constrained width for forms (max-w-md)

## Core Components

**Score Display**
- Card-based layout for each player
- Large score numbers (H1 size)
- Visual progress indicators toward 25/32 target
- Bid/outcome status badges

**Round Tracker**
- Chronological list of completed rounds
- Each round shows: dealer, bidder, bid type, result, score changes
- Expandable for details, collapsible for overview

**Bid Entry Interface**
- Stepper controls for bid selection (1-6/1-8 + Pepper variants)
- Trump suit selector (visual card suit icons via icon library)
- Large, obvious "Confirm Bid" button

**Scoring Interface**
- Binary result capture: Success/Fail
- Automatic calculation display before confirming
- Prominent undo button for last action

**Navigation**
- Top app bar: Game status, settings access
- Bottom action area: Primary round actions
- Floating action button for "New Game" when needed

## Component Library

**Cards:** Elevated surfaces (shadow-md) with p-6 padding
**Buttons:** 
- Primary: Large (h-12), full-width on mobile
- Secondary: Ghost style for less critical actions
**Lists:** Dividers between items, compact spacing (gap-2)
**Icons:** Heroicons (outline style) at 24px standard size
**Badges:** Pill-shaped status indicators (rounded-full, px-3, py-1)

## Information Architecture

**Game Setup Screen:**
- Player count selection (3/4)
- Player name entry (simple text fields)
- Target score display (auto-set to 25/32)
- Dealer selection

**Active Game Screen:**
- Scoreboard (always visible at top)
- Current round status
- Primary action button (context-dependent)
- Round history (collapsible)

**Round Flow Screens:**
1. Bid entry (who's bidding, bid amount, trump selection)
2. Play confirmation (tricks taken input)
3. Score update (animated score change)

## Interaction Patterns

**Error Prevention:**
- Confirmation dialogs for destructive actions (new game, reset)
- Disabled states for invalid actions
- Clear visual feedback on all interactions

**Quick Actions:**
- Swipe to undo last round (with confirmation)
- Long-press player for quick edits
- Tap score for detailed breakdown

**State Management:**
- Clear visual difference between active/completed rounds
- Dealer indicator rotates each round
- Current bidder highlighted during round

## Responsive Behavior

**Mobile (base):** Single column, stacked layout
**Tablet (md:):** Two-column for player grids, side-by-side score displays
**Desktop (lg:):** Max-width container, larger touch targets become hover states

## Accessibility Requirements
- Minimum 4.5:1 contrast ratios throughout
- Focus indicators on all interactive elements
- Screen reader labels for icon-only buttons
- Form validation with clear error messages

## Critical UX Features
- Persistent score display (sticky header)
- Auto-save game state (localStorage)
- Round history with edit capability
- Clear "Pepper" and "Pepper No" visual distinction (iconography + labels)