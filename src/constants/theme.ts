/**
 * iKiguy AI design tokens - ported from the web app's Tailwind theme.
 * A single calm, light palette (the prototype is light-only).
 */

import { Platform } from 'react-native';

export const Colors = {
  /** App canvas - soft lavender-grey behind cards. */
  bg: '#F4F5FA',
  /** Card / surface. */
  card: '#FFFFFF',
  /** Primary headings, near-black. */
  ink: '#1B1D28',
  /** Muted secondary text. */
  inkSoft: '#8A90A2',

  /** Brand purple - active tabs, FAB, primary buttons (matches FAB shadow rgb). */
  primary: '#6B72E8',
  /** Pressed / darker purple. */
  primaryPressed: '#565CD6',
  /** Faint purple wash for tinted buttons / pressed states. */
  primaryTint: '#ECEDFC',

  /** Secondary blue - tags, lab-report button, source chips. */
  secondary: '#5273B8',
  /** Light blue wash. */
  secondaryTint: '#E8EEFB',
  /** Deeper blue ink used on tinted blue surfaces. */
  secondaryInk: '#4A5A85',

  /** AI gold accent ("AI" in the wordmark, FAB plus badge). */
  honey: '#F5A623',
  /** Hairline borders / dividers. */
  hairline: '#ECEDF2',

  // Status palette ---------------------------------------------------------
  statusGood: '#5FBF8E',
  statusCaution: '#F4B860',
  statusFlag: '#F2789F',
} as const;

/** Status chip color sets (bg + text), matching the web StatusChip. */
export const StatusStyles = {
  good: { bg: '#E8F7EF', text: '#3E9B72', dot: Colors.statusGood },
  caution: { bg: '#FDF3E2', text: '#C98A2E', dot: Colors.statusCaution },
  flag: { bg: '#FDEAF1', text: '#D85488', dot: Colors.statusFlag },
} as const;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  eight: 32,
} as const;

export const Radius = {
  /** rounded-input */
  input: 14,
  /** rounded-card */
  card: 20,
  pill: 999,
} as const;

/** Subtle card shadow (web `shadow-soft`). */
export const Shadow = Platform.select({
  ios: {
    shadowColor: '#1B1D28',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  android: { elevation: 2 },
  default: {},
}) as object;

/** Soft glow shadow for the floating mic button. */
export const FabShadow = Platform.select({
  ios: {
    shadowColor: '#6B72E8',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 12 },
  },
  android: { elevation: 8 },
  default: {},
}) as object;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', rounded: 'normal', mono: 'monospace' },
  web: { sans: 'var(--font-display)', rounded: 'var(--font-rounded)', mono: 'var(--font-mono)' },
});

export const MaxContentWidth = 480;
