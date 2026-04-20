# Parallel Agent Prompts — Foothill Park Redesign

Run **Agent 0 first, alone**. Once its PR is merged, run Agents 1/2/3 in parallel on separate branches.

All four prompts assume the agent has access to:
- The repo (`mobile/`)
- The handoff folder (`design_handoff_foothill_park/`) — especially `README.md`

---

## Agent 0 — Shared primitives & tokens  (RUN FIRST, ALONE)

Branch: `redesign/shared`

```
You are Agent 0 of a 4-agent redesign. Your job is to build the shared primitives
the other three agents depend on. DO NOT TOUCH any screen file.

Read design_handoff_foothill_park/README.md end-to-end.

Your deliverables — create/modify ONLY these files:

1. components/PlateDisplay.tsx   — Palestinian licence plate per README spec
                                   (cream body, green border, dark-green JetBrains
                                   Mono text, side panel with Arabic "ف" over "P").
                                   Props: plate (string), size ('sm'|'md'|'lg'|'xl').
                                   Handles parse: "7-0339-96" → ["7","0339","96"].
2. components/GradientHeader.tsx — Gradient band (primary → accent, 135°), props:
                                   title, subtitle, rightSlot, height=140. Two
                                   decorative circles. Use expo-linear-gradient.
3. components/GateFAB.tsx        — Floating call-gate button. Uses existing
                                   GATE_PHONE / GATE_LABEL from constants/config.ts
                                   and the callGate() helper currently in (auth)/_layout.tsx.
                                   Pill shape, primary bg, accent border.
4. components/Avatar.tsx         — Initials circle with deterministic HSL tint.
                                   Props: name, size, bg?. See README "Shared primitives".
5. components/BrandGlyph.tsx     — 88x88 glass square with car-sport Ionicon,
                                   used on Login + AuthCallback. BlurView inside.
6. constants/theme.ts            — ADD ONLY (don't remove existing): radii 18/20/22/24,
                                   textTertiary #9AA5B8, primaryDark #1F4E82,
                                   discord #5865F2 (if missing), gate colors.
7. app/_layout.tsx               — Add font loading: @expo-google-fonts/jetbrains-mono
                                   (700) and @expo-google-fonts/amiri (700). Use useFonts()
                                   + SplashScreen.preventAutoHideAsync() gate. DO NOT
                                   touch AuthGate or the Stack/SafeAreaProvider structure.
8. package.json                  — Add deps: expo-linear-gradient, expo-blur,
                                   @expo-google-fonts/jetbrains-mono,
                                   @expo-google-fonts/amiri, @react-native-async-storage/async-storage
                                   if missing. Then run `expo install` instead of plain install.

Rules:
- Pure RN StyleSheet.create. No third-party UI kits.
- All colors from constants/theme.ts — no inline hex except inside PlateDisplay
  (plate-specific green palette) and gradient stops.
- Every Pressable uses the scale(0.97) press feedback pattern.
- TypeScript strict. Export named components + prop types.

Deliverable: a single commit that builds cleanly (`npx tsc --noEmit` passes,
`npx expo start` boots). Leave all existing screens untouched — they still
render the old UI.
```

---

## Agent 1 — Auth group (Login · Callback · Onboarding)

Branch: `redesign/auth`  (start AFTER Agent 0 merges)

```
You are Agent 1 of a parallel redesign. Read design_handoff_foothill_park/README.md
sections 01 / 02 / 03 carefully, plus the "Shared primitives" section.

Implement ONLY these files:
  - app/login.tsx        (screen 01)
  - app/auth.tsx         (screen 02)
  - app/onboarding.tsx   (screen 03)

Use the shared primitives Agent 0 already built:
  import PlateDisplay from '../components/PlateDisplay';
  import BrandGlyph from '../components/BrandGlyph';

Requirements:
- KEEP every hook, context call, and API call from the current files intact:
  useAuth(), signIn(), the entire PKCE useEffect in auth.tsx, isValidPlate,
  normalizePlate, api.registerPlate, setHasPlate, router.replace logic.
- Only rebuild the visual layer (styles + component tree).
- Use LinearGradient from expo-linear-gradient for the 160° auth background.
- Onboarding: live PlateDisplay preview above the input; gradient-framed input
  using a 2px padding wrapper trick (bg = gradient, inner bg = white).
- 3-dot loading animation on Login SSO button (Animated API, staggered).
- Spinner on auth.tsx: rotate an Animated.View with a white-topped ring.

Forbidden:
- Do not touch any file outside the three listed.
- Do not add new tokens to theme.ts (Agent 0 did that).
- Do not change route names or the export shape (still `export default function ...`).

Verify: `npx tsc --noEmit` + `npx expo start` on iOS simulator — all three screens
render, SSO button triggers signIn (network can fail — that's fine), onboarding
submit hits api.registerPlate.
```

---

## Agent 2 — Scan + Camera

Branch: `redesign/scan`  (parallel with Agents 1 & 3)

```
You are Agent 2 of a parallel redesign. Read design_handoff_foothill_park/README.md
sections 04 / 05 / 06.

Implement ONLY these files:
  - app/(auth)/scan.tsx              (screens 04 + 05 — default and result state)
  - components/CameraScanner.tsx     (screen 06)
  - components/PlateInput.tsx        (restyle — gradient frame, JetBrains Mono)

Use shared primitives from Agent 0:
  GradientHeader, PlateDisplay, Avatar, GateFAB.

scan.tsx requirements:
- KEEP all existing logic: plate/loading/result/error/cameraOpen state,
  handleLookup, api.lookupPlate, normalizePlate, handlePlateDetected,
  handleReset, KeyboardAvoidingView, ScrollView.
- Default state: camera CTA card + "or enter manually" divider + manual input
  card with "Look up owner" button.
- Result state: slide-up animated card (Animated.View translateY/opacity, 350ms
  ease-out) with hero plate, status pill, avatar, Call/Discord buttons, or
  not-found illustration.
- Loading state: circular spinner card between the two.

CameraScanner.tsx requirements:
- KEEP: useCameraPermissions, takePictureAsync, TextRecognition import,
  extractPlateFromOcr, onPlateDetected callback, permission-denied fallback.
- Add the 4-corner bracket frame (300x150 centered) using 4 absolutely-positioned
  L-shapes. When scanning=true, switch stroke to success color + glow.
- Add animated scan line (Animated.View translateY 0 → frameHeight-8, loop 1.4s).
- Glass top-bar controls (close, OCR status pill) using expo-blur BlurView.
- Shutter button: 76x76, primary bg (success while scanning), 4px white ring.

PlateInput.tsx requirements:
- Same API (value, onChange, error props — preserve existing contract).
- Gradient-framed wrapper: 2px padding, background = LinearGradient(primary→accent)
  when focused/valid, solid border when idle, error color when error.
- Font: 'JetBrainsMono_700Bold' (loaded by Agent 0), 22/700, letterSpacing 3.
- Trailing success check badge (26x26 success circle) when valid.

Forbidden:
- Do not modify services/api.ts, utils/plateParser.ts, utils/ocrParser.ts.
- Do not touch _layout.tsx (Agent 3 owns it).
- Do not touch any file outside your three.

Verify: `npx tsc --noEmit` + scan flow on simulator — manual entry lookup,
camera permission prompt, result card transitions smoothly.
```

---

## Agent 3 — Roster + Profile + Tab shell

Branch: `redesign/roster`  (parallel with Agents 1 & 2)

```
You are Agent 3 of a parallel redesign. Read design_handoff_foothill_park/README.md
sections 07 / 08 / 09.

Implement ONLY these files:
  - app/(auth)/employees.tsx    (screen 07)
  - app/(auth)/profile.tsx      (screens 08 + 09)
  - app/(auth)/_layout.tsx      (tab bar restyle + GateFAB mount)

Use shared primitives from Agent 0:
  GradientHeader, PlateDisplay, Avatar, GateFAB.

employees.tsx requirements:
- KEEP: api.getEmployees, search + filter logic, loading/error states, FlatList.
- GradientHeader with dynamic "{count} TEAMMATES" subtitle.
- Sticky search pill (white bg, border, search icon + clear-x).
- Row: white card radius 18, Avatar (size 46), name + department chip,
  right column with Call + Discord pills.
- Empty state (centered text) + error state (existing).

profile.tsx requirements:
- KEEP every hook and API call: api.getMyPlates, api.registerPlate,
  api.syncBamboo, setHasPlate, signOut, Alert.alert for sync result +
  sign-out confirmation.
- Identity card (white, radius 22) floats up -50px from gradient header.
- Plate card: default shows <PlateDisplay size="lg" plate={currentPlate}/>,
  "Change" button enters edit mode (screen 09).
- Edit mode: gradient-framed input (reuse PlateInput or inline equiv.) +
  Cancel/Save button pair.
- Sync BambooHR card (primary outlined) + Sign out card (error outlined).
- Success toast after sync (success@8% bg card) with inserted/updated/linked/
  deactivated counts. Auto-hides after 4s OR replace with existing Alert —
  your call, pick one and stick to it.

_layout.tsx requirements:
- Restyle Tabs screenOptions: tabBarStyle transparent/glass via
  tabBarBackground={() => <BlurView intensity={20} tint="light" style={...}/>}.
- Active color = primary, inactive = textTertiary. Labels 10/700 active,
  10/500 inactive.
- Mount <GateFAB/> as sibling to <Tabs/>, absolute positioned bottom:104,
  right:16 per README.
- KEEP: the three Tabs.Screen entries (scan / employees / profile), their
  names, the Ionicons mapping, and the callGate helper. Just restyle.

Forbidden:
- Do not touch scan.tsx, login.tsx, onboarding.tsx, auth.tsx.
- Do not modify services/ or utils/.
- Do not add new tokens to theme.ts.

Verify: `npx tsc --noEmit`, then on simulator — tab bar glass effect, Gate FAB
floats on all 3 authed screens, employees search filters live, profile edit
mode saves a new plate, BambooHR sync shows result.
```

---

## Merge order

1. Agent 0 → main  (shared primitives land first)
2. Rebase Agents 1/2/3 onto main
3. Merge Agent 1 → main  (smallest surface area)
4. Merge Agent 2 → main  (touches shared PlateInput)
5. Merge Agent 3 → main  (touches _layout.tsx — do last)

## If conflicts surface

Only one file is truly shared risk: `package.json`. Have Agent 0 add **all** deps
(even ones only Agents 2 or 3 use) so the later PRs never touch it.
