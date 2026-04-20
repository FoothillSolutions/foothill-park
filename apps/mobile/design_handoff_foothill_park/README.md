# Handoff: Foothill Park — Full UI Redesign

## Overview
Foothill Park is an internal employee parking app for Foothill Technology Solutions. Employees use it to look up the owner of any car on the company lot (by licence plate), call them, DM them on Discord, or call the security gate. This handoff is a complete visual redesign of every screen in the app — same logic, same API, fresh visual layer.

## About the Design Files
The files in this bundle are **design references created in HTML/React** — interactive prototypes showing the intended look, layout, and behavior. They are **not production code to copy directly**.

The task is to **recreate these designs in the existing React Native / Expo codebase** (`mobile/`), using its established patterns:
- `expo-router` for navigation (do not change routes or file structure)
- Pure `StyleSheet.create` (no third-party UI library)
- `@expo/vector-icons` (Ionicons) for icons
- `expo-linear-gradient` for gradients
- `expo-blur` for glass / backdrop-filter effects
- `@expo-google-fonts/*` or `expo-font` for custom fonts

**Keep every piece of existing logic intact** — state hooks, `useAuth()`, API calls (`api.lookupPlate`, `api.getEmployees`, `api.registerPlate`, `api.syncBamboo`), deep-linking, PKCE handling, navigation via `useRouter`. Only the visual layer changes.

## Fidelity
**High-fidelity (hi-fi).** Exact colors, spacing, typography, gradients, shadows, and interactions are defined below. Aim for pixel-perfect parity with the prototype.

---

## Design Tokens

All tokens already live in `mobile/constants/theme.ts`. Do not add new top-level colors — extend the existing token file if needed.

### Colors (from existing `theme.ts`)
| Token | Hex | Use |
|---|---|---|
| `primary` | `#2D6DB5` | Buttons, headers, active tab, primary CTAs |
| `primaryDark` | `#1F4E82` | Gradient dark-end on login/auth |
| `dark` | `#1A1A2E` | Primary text, login gradient end |
| `accent` | `#5BA4E6` | Gradient co-star, highlights, secondary CTAs |
| `white` | `#FFFFFF` | Card surfaces, primary backgrounds |
| `discord` | `#5865F2` | Discord action chips/buttons |
| `surface` | `#F5F8FC` | App backgrounds on authed screens |
| `border` | `#D6E4F5` | Card borders, dividers |
| `textPrimary` | `#1A1A2E` | Headings, body |
| `textSecondary` | `#6B7A90` | Supporting text |
| `textTertiary` | `#9AA5B8` | Hints, captions, tab inactive |
| `success` | `#28A745` | Validation, "Match found" state |
| `error` | `#D9534F` | Errors, destructive (sign out) |

### Palestinian plate colors (used only inside `<PlateDisplay>`)
- Plate body: `#EDEDE0` (warm off-white)
- Plate ink / border: `#1F5E3A` (dark green)
- Side panel: `#2F7A48` (medium green)
- Side panel text: `#F3F2E3`

### Typography
- **UI:** San Francisco via `-apple-system` / system default on RN
- **Plate number:** JetBrains Mono 700 (load via `@expo-google-fonts/jetbrains-mono`) — fallback `Menlo`/`Courier` bold
- **Arabic "ف" on plate:** Amiri 700 (`@expo-google-fonts/amiri`) — fallback system Arabic

### Spacing — existing scale in `theme.ts`
`xs 4 · sm 8 · md 16 · lg 24 · xl 32 · xxl 48`

### Radii
- `sm 8` · `md 12` · `lg 16` — existing tokens
- **New values used in redesign:** 18 (list cards), 20 (primary CTA cards), 22 (identity card), 24 (result card), 26–28 (image cut-outs), `full` (pills/FABs)

### Shadows (iOS + Android)
All cards use a subtle layered shadow:
```ts
// iOS
shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.04, shadowRadius: 10,
// Android
elevation: 2,
```
Elevated cards (result card, identity card): opacity 0.08–0.12, elevation 4–6.
FAB (Gate): `shadowColor: primary, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8`.

### Gradients
- **Auth/Login background:**
  `linear-gradient(160deg, #2D6DB5 0%, #244E86 45%, #1A1A2E 100%)`
- **Authed-screen header:**
  `linear-gradient(135deg, #2D6DB5 0%, #5BA4E6 100%)`
- **Input "active" border:**
  `linear-gradient(135deg, #2D6DB5, #5BA4E6)` as a 2px outer frame

Use `<LinearGradient>` from `expo-linear-gradient`.

---

## Screens / Views

Screen order in the prototype matches the file mapping below. Reference these for exact layouts:

| # | Prototype frame | Maps to file |
|---|---|---|
| 01 | Login | `mobile/app/login.tsx` |
| 02 | Auth callback | `mobile/app/auth.tsx` |
| 03 | Onboarding | `mobile/app/onboarding.tsx` |
| 04 | Scan (default) | `mobile/app/(auth)/scan.tsx` |
| 05 | Scan result | `mobile/app/(auth)/scan.tsx` (result state) |
| 06 | Camera view | `mobile/components/CameraScanner.tsx` |
| 07 | Employees | `mobile/app/(auth)/employees.tsx` |
| 08 | Profile | `mobile/app/(auth)/profile.tsx` |
| 09 | Profile (editing) | `mobile/app/(auth)/profile.tsx` (edit state) |

### 01 — Login (`app/login.tsx`)
**Purpose:** Single-action Microsoft SSO sign-in for Foothill employees.

**Layout:**
- Full-bleed gradient background (see "Auth/Login background" token above).
- Two radial-orb decorations (rgba accent/primary with 10–14 px blur) top-right and bottom-left for depth.
- Top-right label: `v1.0 · INTERNAL`, 11px, 600, letter-spacing 1.5, color rgba(255,255,255,0.55).
- Centered hero column:
  - Logo mark: 88×88, radius 24, `rgba(255,255,255,0.12)` with `BlurView intensity={20}`, 1px rgba(255,255,255,0.2) border, car icon 44px white inside.
  - Eyebrow label: `FOOTHILL PARK`, 14px / 600 / tracking 3 / accent color.
  - Headline: "Park smarter.\nMove faster." — 36px / 700 / tracking -0.8 / white / lineHeight 1.05 / `textWrap: 'balance'`.
  - Subtitle: "Find the person behind any plate on the Foothill lot in seconds." — 15px / rgba(255,255,255,0.7) / max-width 280 / centered.
- Bottom CTA:
  - White button 100% × 58, radius 16, shadow 0/8/24 rgba(0,0,0,0.25).
  - Contains Microsoft 4-square SVG (22px) + "Sign in with Microsoft" (16/600/dark).
  - Shows animated 3-dot loader in primary color while `authState.status === 'loading'`.
- Footer text: `FOOTHILL TECHNOLOGY SOLUTIONS · SSO SECURED` — 12px / rgba(255,255,255,0.5) / centered.

**Keep existing logic:** `useAuth()`, `signIn` call, disabled state during loading.

### 02 — Auth callback (`app/auth.tsx`)
**Purpose:** Shown while PKCE code exchange happens after MS SSO redirect.

- Same gradient background as login (visual continuity).
- Centered column (gap 28):
  - Logo mark (identical to login, 88×88 glass square with car icon).
  - Circular spinner 44×44: 3px border rgba(255,255,255,0.15), top-color white, `animation: spin 900ms linear infinite`.
  - Title: "Signing you in…" — 19px / 600 / white.
  - Sub: "Verifying your Foothill credentials" — 13px / rgba(255,255,255,0.6).

**Keep existing logic:** all of the `useEffect` PKCE token-exchange flow untouched.

### 03 — Onboarding (`app/onboarding.tsx`)
**Purpose:** First-time user registers their licence plate.

**Layout (top → bottom):**
1. **Gradient header band** (primary → accent, 135°, paddingTop 58, paddingBottom 24):
   - Progress pills: two 4px-tall bars, gap 6; first filled white, second `rgba(255,255,255,0.3)`.
   - Eyebrow: `STEP 1 OF 2` — 12/700/letter 1.5/rgba(255,255,255,0.8).
   - Title: "Register your\nlicence plate" — 26/700/tracking -0.5/white.
2. **Why card** (surface, radius 18, border, padding 16):
   - 36×36 shield icon tile (primary @ 8% bg, primary icon).
   - "Why do we need this?" 14/600 + "Teammates can reach you too when your car is in the way." 13/textSecondary/lineHeight 1.5.
3. **Live `<PlateDisplay size="lg">`** — rerenders as user types.
4. **Input block:**
   - Label: `YOUR LICENCE PLATE` 12/700/tracking 1.2/textSecondary/uppercase.
   - Input wrapper with 2px gradient border (active/valid) or 2px border color (idle) or error color.
   - Input: `padding: 16px / 48px / 16px / 16px`, 22/700 JetBrains Mono letter-spacing 3, placeholder `e.g. 7-0339-96`.
   - Trailing check badge when valid: 26×26 success-color circle with white check.
   - Helper text below:
     - Error: 13/error.
     - Valid: 13/success "Looks good — ready to register".
     - Idle: 13/textTertiary "Letters, numbers, dashes only".
5. **Sticky bottom CTA** (white fade overlay above):
   - Primary button 56 tall, radius 16, shadow `0 8 20 #2D6DB540`.
   - Text "Register & continue" (16/600/white) + right-arrow icon.
   - Footer: "You can change this any time in your profile" 12/textTertiary.

**Keep existing logic:** `isValidPlate`, `normalizePlate`, `api.registerPlate`, `setHasPlate`, `router.replace('/(auth)/scan')`, `KeyboardAvoidingView`, `ScrollView`.

### 04 — Scan (default) (`app/(auth)/scan.tsx`)
**Purpose:** Landing page for authenticated users; look up a plate.

**Header:** gradient header 140 tall. Eyebrow `QUICK LOOK-UP`, title "Which car is\nblocking you?" 30/700/white/tracking -0.5.

**Body (padding 18/16/150):**
- **Camera CTA card:** white, radius 20, border, shadow. Flex-row with:
  - 56×56 icon tile with gradient fill (primary → accent), radius 16, shadow `0 6 14 primary@40%`, camera icon 26/white inside.
  - Title "Scan with camera" (17/700/dark) + sub "Point at the plate — we'll read it" (13/textSecondary).
  - Right chevron.
- **"or enter manually" divider** — two horizontal lines of `border`, center label 11/700/tracking 1.5/tertiary/uppercase.
- **Manual card:** white, radius 20, padding 18, border, shadow.
  - Label `PLATE NUMBER` 11/700/tracking 1.2/textSecondary.
  - Input with gradient frame (same style as Onboarding input), 22/700 JetBrains Mono, placeholder `e.g. 7-0339-96`.
  - "Look up owner" button: accent background, 52 tall, radius 14, search icon + label (16/600/white).
- Tip caption: 12/textTertiary centered.

**Loading state:** card 40-padded, 60×60 circular spinner (border 4, borderTop primary), text "Searching Foothill roster…" 16/600.

**Keep existing logic:** `handleLookup`, `setCameraOpen`, result/error state, `isValidPlate`, `PlateInput`.

### 05 — Scan result (same file, result ≠ null)
A slide-up card (animation `from translateY:24, opacity:0 → 0; 350ms ease-out`), radius 24, border, shadow `0 10 30 rgba(30,50,90,0.12)`:

**Hero block:** gradient-tinted bg (primary @ 8% → accent @ 4%), bottom-bordered.
- Status pill (above plate): 6×6 dot + "MATCH FOUND" or "NOT REGISTERED" — success/error color, dot glow 4px ring of color @ 13%.
- `<PlateDisplay size="lg">` centered.

**If found:**
- Row 22/20-padded: 56px `<Avatar>` + name (20/700/tracking -0.3) + department (13/textSecondary).
- Action row (padding 18/16): two 52-tall buttons flex-1, gap 10:
  - **Call** (primary bg, phone icon + "Call", white, shadow primary @ 20%).
  - **Discord** (discord bg `#5865F2`, Discord glyph + "Discord", white, shadow discord @ 20%).

**If not found:**
- 60×60 error-@8%-bg circle with 28px close icon.
- "No employee found" 17/700 + "The car may belong to a visitor." 14/textSecondary.

**Bottom row (both states):** border-top divider, centered link "Search another plate" 15/600/primary.

### 06 — Camera view (`components/CameraScanner.tsx`)
Full-screen over `<CameraView>`:

- **Cutout mask:** 4 semi-transparent (rgba(0,0,0,0.62)) panels around a central 300×150 frame. Frame is centered (`top/bottom: calc(50% - 75px)`, `left/right: calc(50% - 150px)`).
- **Corner brackets:** 4 × 32×32 L-shapes, 4px stroke, white. When scanning: switch to success color + 16px glow (`shadowRadius` large).
- **Scan line:** 2px tall, width = frame - 12, gradient `transparent → success → transparent`, `shadowRadius 12 success`, animation `scanLine 1.4s linear infinite` (top 6 ↔ bottom-6).
- **Top chrome:** flex-row justify-between at top 58:
  - Close button: 44 circle, rgba(0,0,0,0.5) + BlurView + 1px white@10% border, close icon 22/white.
  - Status pill: padding 8/14, pill radius, glass bg, 12/600 white + accent sparkle icon, text "OCR on-device".
- **Hint pill:** positioned `top: calc(50% + 100px)`, centered. Glass pill, 13/600/white. Text: `"Aim at the licence plate"` → `"Reading plate…"` while scanning.
- **Shutter button:** bottom 48, 76×76, primary bg (switches to success while scanning), 4px rgba(255,255,255,0.9) ring, shadow `0 8 24 rgba(0,0,0,0.5)`, camera icon 30 inside or spinner while scanning.

**Keep existing logic:** `useCameraPermissions`, `takePictureAsync`, `TextRecognition`, `extractPlateFromOcr`, permission-denied fallback UI (restyle using same button tokens).

### 07 — Employees (`app/(auth)/employees.tsx`)
**Purpose:** Searchable roster.

- **Gradient header** (140 tall): eyebrow `{count} TEAMMATES`, title "People" (30/700/white). Right slot: 44×44 glass square with `people` icon.
- **Sticky search:** padding 14/16/10 on surface bg. White pill input, radius 14, border, padding 12/14. Search icon + `TextInput` (15/dark, placeholder "Search by name or department…"). Clear `×` circle button when text present.
- **List:** padding 8/16/140. Each row:
  - White card, radius 18, border, padding 14, margin-bottom 10, shadow `0 1 2 rgba(30,50,90,0.03)`.
  - Flex-row: 46 `<Avatar>` (deterministic HSL from name hash) + body column + actions column.
  - Body: name 15/700/tracking -0.2 + department chip inline-block `primary@8% bg, primary text, radius 6, padding 2/8, 11/600`.
  - Actions (column, right-aligned, gap 5):
    - **Call pill:** primary bg, pill, padding 6/10, phone icon 12 + "Call" 11/700/white. (If no phone: 10/textTertiary "No phone" instead.)
    - **Discord pill:** discord bg, Discord icon 12 + `{discordId}` 11/700.
- **Empty state:** centered 15/600 "No matches" + 13 "Try a different name or team".
- **Gate FAB** (shared) + **Tab bar** (shared, active=employees).

**Keep existing logic:** `api.getEmployees`, search filter, loading + error states.

### 08 — Profile (`app/(auth)/profile.tsx`)
**Purpose:** My account, my plate, admin sync, sign out.

- **Gradient header** (150 tall): eyebrow `ACCOUNT`, title "My Profile" 30/700.
- **Identity card** (floats up by translating content by -50):
  - White, radius 22, padding 22, shadow `0 10 28 rgba(30,50,90,0.08)`, border.
  - 78px `<Avatar>`, name (20/700/tracking -0.3), email (13/textSecondary).
  - Status chip: `success@9% bg / success text`, pill-shape, padding 4/10, 11/700/uppercase, 6px pulsing success dot + "Active employee".
- **Plate card** (white, radius 22, border, padding 20):
  - Header row: label `MY LICENCE PLATE` 11/700/tracking 1.2/textSecondary + "Change" pill button (primary@8% bg, primary text, edit icon 13).
  - Body: centered `<PlateDisplay size="lg">` with the Palestinian plate rendering.
- **Sync BambooHR card** (primary outlined): white bg, 1.5px primary border, radius 16, padding 14/16. 36×36 primary@8% tile with bamboo icon, title "Sync BambooHR" 15/700/primary + sub "Pulls latest employees & plates" 12/textSecondary. Spinner or chevron on the right.
  - Success toast (after sync): `success@8% bg / success@20% border / success text`, radius 12, padding 10/14. Inline stats: `✓ Inserted {n}`, `Updated {n}`, `Linked {n}`, `Deactivated {n}` (12/600, flex-wrap, gap 12).
- **Sign out card**: white, 1.5px `error@33%` border, radius 16, padding 14/16. 36×36 error@8% tile with logout icon, title "Sign out" 15/700/error + sub "You'll need to sign in again" 12/textSecondary. Chevron.
- Footer: `Foothill Park · v1.0 · Internal build` 11/textTertiary centered.
- **Gate FAB** + **Tab bar** (active=profile).

### 09 — Profile (editing state)
When "Change" is tapped the plate card swaps to edit mode:
- Gradient-framed input (same pattern as Onboarding), JetBrains Mono 22/700.
- Two side-by-side buttons (flex-1, 46 tall, radius 12, gap 10):
  - **Cancel:** white bg, 1.5px border, dark text 14/600.
  - **Save:** primary bg, white text 14/600. Disabled until valid plate. Shows 3-dot loader while saving.

**Keep existing logic:** `api.getMyPlates`, `api.registerPlate`, `setHasPlate`, `api.syncBamboo`, `Alert` for sync result + sign-out confirm, `signOut`.

---

## Shared primitives to build once

### `<PlateDisplay plate size>` — Palestinian plate
Sizes: `sm 180×52` · `md 240×68` · `lg 280×78` · `xl 320×90` (width × height).

- Body: `#EDEDE0`, 2px `#1F5E3A` border, radius 8.
- Shadow + inset highlight (simulate embossed feel).
- **Left region (flex 1):** number parts split on dashes (e.g. `7 · 0339 · 96`), each separator is a 3px-tall short green bar (width ≈ fs × 0.3). JetBrains Mono 700, color `#1F5E3A`, letter-spacing 1, subtle white text-shadow.
- **Right panel:** width 24–42 (per size), `#2F7A48` bg, left border same as plate ink. Inside (centered column):
  - Arabic `ف` (Amiri 700, fs ≈ stripFs + 2, color `#F3F2E3`).
  - Latin `P` below (system font, bold, slightly smaller, color `#F3F2E3`).
- Top 45% overlay: `linear-gradient(rgba(255,255,255,0.35), transparent)` for subtle highlight.

The parse logic: match `^(\w{1,2})[-\s]+(\w{2,5})[-\s]+(\w{1,3})$`, fallback to split on dash/space. Example values: `7-0339-96`, `2-1139-A`.

### `<GradientHeader title subtitle rightSlot height=140>`
Absolute-to-flex column with bottom alignment. Two decorative `rgba(255,255,255,0.08)` circles positioned top-right (200×200) and bottom (140×140) for subtle texture. Use `expo-linear-gradient` with `colors={[primary, accent]}, start={{x:0,y:0}}, end={{x:1,y:1}}`.

### `<GateFAB>` — persistent call-gate button
Absolute `right: 16, bottom: 104`, pill. Primary bg, 1.5px accent border, phone icon 15 + "Call Gate" 13/700/tracking 0.3 white. Shadow `0 6 16 primary@40%`. Uses existing `GATE_PHONE` / `GATE_LABEL` from `constants/config.ts` and the existing `callGate()` helper.

### `<TabBar active onNav>` — 3-tab glass bar
Absolute bottom. Glass bg `rgba(255,255,255,0.92)` + `BlurView intensity={20}`. Top border `border` token. Three items (Scan, People, Profile) — active uses primary color + stroke 2.4; inactive uses textTertiary + stroke 2. Labels 10/700 when active, 10/500 otherwise. Bottom padding 28 to clear the home indicator.

### `<Avatar name size bg?>`
Initials from first two words, uppercase. Deterministic HSL hue from char-code sum (`hue = (sum * 37) % 360`, `hsl(hue, 45%, 55%)`) unless `bg` is explicitly passed. White bold text, fs = size × 0.4.

### `<Pressable>` wrapper (if not using RN's built-in)
Applies a `scale(0.97)` transform on press-down and 120ms transition. Use `Pressable` from `react-native` with a style-callback: `({pressed}) => [..., pressed && {transform:[{scale:0.97}]}]`.

### Animations
- `spin` — 900ms linear infinite rotation for spinners.
- `slideUp` — 350ms ease-out from `translateY(24)` + opacity 0 → 0/1 for result card.
- `scanLine` — 1.4s linear infinite, top 6 ↔ (height − 8), in the camera corner-bracket frame.
- `dotPulse` — 1.2s infinite with staggered delays (0, 0.15s, 0.3s) for the 3-dot button loader: opacity 0.3 → 1 → 0.3 with `scale(0.7 → 1 → 0.7)`.
- Pressable press feedback — 120ms `scale(0.97)`.

Use `react-native-reanimated` (already common in Expo) or `Animated` from `react-native`. For infinite SVG/View rotations, `withRepeat` + `withTiming` is the idiomatic choice.

---

## Interactions & Behavior

- **Login:** tap SSO → existing `signIn()` flow → MS browser redirect → auth.tsx handles callback → router pushes to scan.
- **Onboarding:** input validates live using `isValidPlate`. Submit disabled until valid. On submit: show loader, call `api.registerPlate(normalizePlate(plate))`, set plate flag, navigate to `/(auth)/scan`.
- **Scan default:** two entry points — camera (opens `CameraScanner`) or manual input + "Look up owner". On lookup: call `api.lookupPlate(normalizePlate(plate))`, render result card.
- **Scan result:** found → Call/Discord buttons use `Linking.openURL('tel:...')` / `Linking.openURL('discord://')`. Not-found → same "Search another plate" reset.
- **Camera:** shutter disabled while scanning. On OCR match → parent `handlePlateDetected(plate)` returns to Scan screen and triggers lookup.
- **Employees:** search filters by name OR department (case-insensitive). Call pill → `tel:`. Discord pill → `discord://`.
- **Profile:** "Change" enters edit mode, same input behavior as Onboarding. "Sync BambooHR" → shows spinner, then `Alert` with result counts. "Sign out" → confirmation `Alert` then `signOut()`.
- **Gate FAB:** visible on all authed screens — existing `callGate()` uses `Linking.openURL('tel:${GATE_PHONE}')`.

## State Management

No new state beyond what's already in the existing files. Notable:
- `AuthContext` (`contexts/AuthContext.tsx`) — untouched.
- Scan screen: `plate, loading, result, error, cameraOpen`.
- Onboarding: `plate, error, loading`.
- Profile: `currentPlate, newPlate, editing, saving, plateError, syncing`.

---

## Assets

- **Icons:** all via `@expo/vector-icons` (`Ionicons`). In the HTML prototype icons are inline SVG — map as:
  - `search` → `Ionicons name="search"`
  - `people` → `people`
  - `person` → `person-circle-outline`
  - `camera` → `camera`
  - `phone` → `call`
  - `close` → `close`
  - `check` → `checkmark`
  - `arrow-right` → `arrow-forward`
  - `chevron` → `chevron-forward`
  - `car` → `car-sport`
  - `edit` → `pencil`
  - `logout` → `log-out-outline`
  - `shield` → `shield-checkmark`
  - `sparkle` → `sparkles`
  - `bamboo` → use a leaf-ish icon or keep existing text button
- **Discord glyph:** not in Ionicons — use `<FontAwesome5 name="discord">` or inline SVG (provided in `screens/Shared.jsx`).
- **Microsoft 4-square logo:** inline SVG (provided in `screens/Shared.jsx` `<Icon name="microsoft">`).
- **Existing logo asset:** `mobile/assets/logo.png` — can be used in place of the car-icon glass square if you prefer literal branding.
- **Fonts:** JetBrains Mono (plate numbers), Amiri (Arabic "ف"). Load via `@expo-google-fonts/jetbrains-mono` and `@expo-google-fonts/amiri`, then `useFonts()` in `_layout.tsx` with a splash gate.

---

## Files

HTML/React prototype files in this package:

- `Foothill Park Redesign.html` — main canvas, renders all 9 frames
- `ios-frame.jsx` — device frame used for the mockups (not needed for RN)
- `screens/Shared.jsx` — shared primitives: `PlateDisplay`, `Icon`, `Pressable`, `GradientHeader`, `TabBar`, `GateFAB`, `Avatar`, color tokens `T`
- `screens/Auth.jsx` — `LoginScreen`, `AuthCallbackScreen`, `LoadingDots`
- `screens/Onboarding.jsx` — `OnboardingScreen`
- `screens/Scan.jsx` — `ScanScreen`, `ResultCard`, `CameraView`
- `screens/Employees.jsx` — `EmployeesScreen` + `DEMO_EMPLOYEES` fixture
- `screens/Profile.jsx` — `ProfileScreen`

Open `Foothill Park Redesign.html` in a browser for the full interactive reference. All nine frames render side-by-side in iPhone bezels.

## Target codebase files to modify

```
mobile/
├── app/
│   ├── login.tsx                  ← screen 01
│   ├── auth.tsx                   ← screen 02
│   ├── onboarding.tsx             ← screen 03
│   └── (auth)/
│       ├── _layout.tsx            ← tab bar + Gate FAB (restyle)
│       ├── scan.tsx               ← screens 04 + 05
│       ├── employees.tsx          ← screen 07
│       └── profile.tsx            ← screens 08 + 09
├── components/
│   ├── CameraScanner.tsx          ← screen 06
│   ├── PlateInput.tsx             ← restyled with gradient frame
│   └── PlateDisplay.tsx           ← NEW — Palestinian plate component
└── constants/
    └── theme.ts                   ← add new radii + text color tokens if needed
```

**Do not change** `contexts/AuthContext.tsx`, `services/api.ts`, `services/auth.ts`, `utils/plateParser.ts`, `utils/ocrParser.ts`, or the router structure.
