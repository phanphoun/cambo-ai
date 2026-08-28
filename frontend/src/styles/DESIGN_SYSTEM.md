# Cambo AI — Design System

Version: 0.1.0
Owner: Cambo AI
Status: Draft

## 1. Purpose

This document defines the single source of truth for Cambo AI’s visual language. It exists to keep the product culturally coherent, technically consistent, and easy to extend.

## 2. Design Principles

- Cambodia-first: local context before global defaults
- Clear over clever: hierarchy before decoration
- restrained motion: animation supports meaning, not attention
- accessible by default: contrast, focus, reduced motion

## 3. Color System

### 3.1 Brand Colors

| Name | Hex | Usage |
|---|---|---|
| Gold | `#D4AF37` | Primary accent, CTA highlights |
| Terracotta | `#A0522D` | Secondary accent |
| Crimson | `#8B0000` | Strong emphasis, branding |
| Jade | `#00A86B` | Success, positive state |
| Charcoal | `#2C2C2C` | Dark surface, default app background |

### 3.2 Neutral Colors

| Name | Hex | Usage |
|---|---|---|
| Ink | `#1A1A1A` | Primary text on light |
| Steel | `#6B7280` | Secondary text |
| Cloud | `#9CA3AF` | Placeholder / disabled |
| Mist | `#E5E7EB` | Border / divider |
| Snow | `#F9FAFB` | Page background |
| Paper | `#FFFFFF` | Card / raised surface |

### 3.3 Semantic Colors

| Name | Hex | Usage |
|---|---|---|
| Success | `#16A34A` | Success state |
| Warning | `#F59E0B` | Caution state |
| Danger | `#DC2626` | Error state |

### 3.4 Surface System

| Token | Light | Dark |
|---|---|---|
| `--cambo-surface-base` | `#FFFFFF` | `#0B0F19` |
| `--cambo-surface-raised` | `#FFFFFF` | `#111827` |
| `--cambo-surface-overlay` | `rgba(20,20,20,0.55)` | `rgba(0,0,0,0.65)` |

## 4. Typography

### 4.1 Font Stack

- English: `Inter`
- Khmer primary: `Noto Sans Khmer`
- Khmer fallback: `Battambang`, `system-ui`
- Display: `Playfair Display`
- Mono: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`

### 4.2 Type Scale

| Token | Size | Use Case |
|---|---|---|
| `--text-xs` | 12px | Labels, metadata |
| `--text-sm` | 14px | Secondary text |
| `--text-base` | 16px | Body text |
| `--text-lg` | 18px | Lead text |
| `--text-xl` | 20px | Section heading |
| `--text-2xl` | 24px | Page heading |
| `--text-3xl` | 30px | Hero heading |
| `--text-4xl` | 36px | Marketing hero |

### 4.3 Line Height

- Tight: `1.15`
- Snug: `1.3`
- Normal: `1.5`
- Relaxed: `1.65`

## 5. Spacing

Base unit: `4px`

| Token | Value | Usage |
|---|---|---|
| `--space-1` | 4px | Tight gaps |
| `--space-2` | 8px | Compact spacing |
| `--space-3` | 12px | Dense UI spacing |
| `--space-4` | 16px | Standard spacing |
| `--space-5` | 20px | Medium spacing |
| `--space-6` | 24px | Comfortable spacing |
| `--space-8` | 32px | Section spacing |
| `--space-10` | 40px | Large spacing |
| `--space-12` | 48px | Extra large spacing |
| `--space-16` | 64px | Page-level spacing |
| `--space-20` | 80px | Hero spacing |

## 6. Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | 4px | Small chips |
| `--radius-md` | 8px | Inputs, buttons |
| `--radius-lg` | 12px | Cards |
| `--radius-xl` | 16px | Large cards |
| `--radius-2xl` | 24px | Modals, panels |
| `--radius-full` | 9999px | Pills |

## 7. Shadow System

| Token | Description |
|---|---|
| `--shadow-xs` | Subtle elevation |
| `--shadow-sm` | Small card / button |
| `--shadow-md` | Card hover |
| `--shadow-lg` | Modal / dropdown |
| `--shadow-xl` | Sheet / drawer |
| `--shadow-gold` | Accent shadow for CTAs |

## 8. Component Library

### 8.1 Buttons

- Primary: filled, bold, shadow-md
- Secondary: bordered, gold text
- Ghost: minimal, hover background only
- Gold: gradient CTA, shadow-gold

Interaction rules:
- Hover: lift by 2px
- Active: translate down by 1px
- Focus: visible ring with gold accent

### 8.2 Cards

- Background: surface-raised
- Border: gold at 18% opacity
- Hover: lift 4px, border opacity 50%
- Padding: space-6

### 8.3 Inputs

- Background: paper
- Border: mist
- Focus: gold border + gold ring
- Placeholder: cloud
- Font: sans by default, khmer when language context requires

### 8.4 Modals

- Backdrop: surface-overlay + blur
- Animation: fade-in + scale from 0.98 to 1
- Corner radius: 2xl
- Max width: 560px

## 9. Iconography

- Size system: 16px, 20px, 24px
- Style: outlined for secondary, filled for primary
- Color: inherit from text color or semantic token
- Khmer context: avoid emoji in core UI; use simple geometric motifs instead

## 10. Animation Principles

- Duration: 200-400ms for controls, 400-800ms for reveals
- Easing: ease-out for enter, ease-in for exit
- Reduce motion: respect `prefers-reduced-motion`
- Purpose: state change, feedback, continuity
