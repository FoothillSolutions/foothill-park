// Shared tokens, icons, plate display, buttons

const T = {
  primary: '#2D6DB5',
  primaryDark: '#1F4E82',
  dark: '#1A1A2E',
  accent: '#5BA4E6',
  white: '#FFFFFF',
  discord: '#5865F2',
  surface: '#F5F8FC',
  border: '#D6E4F5',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7A90',
  textTertiary: '#9AA5B8',
  error: '#D9534F',
  success: '#28A745',
  gateOrange: '#F59E0B',
};

// Simple line icons as SVG (stroke=currentColor so color: rules apply)
const Icon = ({ name, size = 22, color = 'currentColor', strokeWidth = 2 }) => {
  const s = { width: size, height: size, color, flexShrink: 0 };
  const sw = strokeWidth;
  switch (name) {
    case 'search':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={s}>
          <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
        </svg>
      );
    case 'people':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={s}>
          <circle cx="9" cy="8" r="4"/><path d="M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7"/><circle cx="17" cy="6" r="3"/><path d="M22 18c0-2.8-2.2-5-5-5"/>
        </svg>
      );
    case 'person':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={s}>
          <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>
        </svg>
      );
    case 'camera':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={s}>
          <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      );
    case 'phone':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={s}>
          <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z"/>
        </svg>
      );
    case 'close':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={s}>
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
      );
    case 'check':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw + 0.5} strokeLinecap="round" strokeLinejoin="round" style={s}>
          <path d="m5 12 5 5 10-11"/>
        </svg>
      );
    case 'arrow-right':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={s}>
          <path d="M5 12h14M13 5l7 7-7 7"/>
        </svg>
      );
    case 'chevron':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={s}>
          <path d="m9 6 6 6-6 6"/>
        </svg>
      );
    case 'car':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={s}>
          <path d="M5 16V11l2-5h10l2 5v5M5 16h14M5 16v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2M19 16v2a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-2"/>
          <circle cx="8" cy="13.5" r="1" fill={color}/><circle cx="16" cy="13.5" r="1" fill={color}/>
        </svg>
      );
    case 'discord':
      return (
        <svg viewBox="0 0 24 24" fill={color} style={s}>
          <path d="M19.27 5.33A17.8 17.8 0 0 0 14.81 4c-.19.33-.42.78-.57 1.13a16.46 16.46 0 0 0-4.48 0c-.15-.35-.39-.8-.58-1.13C7.68 4 6.21 4.47 4.77 5.33c-2.8 4.2-3.55 8.3-3.18 12.33A18 18 0 0 0 6.7 20c.36-.49.67-1 .94-1.54a11.7 11.7 0 0 1-1.47-.7c.12-.09.24-.18.36-.28a12.8 12.8 0 0 0 10.94 0c.12.1.24.19.36.28-.47.27-.96.5-1.47.7.27.54.58 1.05.94 1.54a18 18 0 0 0 5.1-2.34c.44-4.6-.75-8.67-3.13-12.33zM8.52 15c-1.05 0-1.92-.96-1.92-2.14 0-1.17.85-2.13 1.92-2.13s1.93.96 1.92 2.13c0 1.18-.86 2.14-1.92 2.14zm6.96 0c-1.06 0-1.92-.96-1.92-2.14 0-1.17.85-2.13 1.92-2.13s1.93.96 1.92 2.13c0 1.18-.85 2.14-1.92 2.14z"/>
        </svg>
      );
    case 'bamboo':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={s}>
          <path d="M12 2v20M8 6h4M8 12h4M8 18h4M16 9h-2M16 15h-2"/>
        </svg>
      );
    case 'logout':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={s}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
        </svg>
      );
    case 'edit':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={s}>
          <path d="M12 20h9M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
        </svg>
      );
    case 'microsoft':
      return (
        <svg viewBox="0 0 24 24" style={s}>
          <rect x="2" y="2" width="9.5" height="9.5" fill="#F35325"/>
          <rect x="12.5" y="2" width="9.5" height="9.5" fill="#81BC06"/>
          <rect x="2" y="12.5" width="9.5" height="9.5" fill="#05A6F0"/>
          <rect x="12.5" y="12.5" width="9.5" height="9.5" fill="#FFBA08"/>
        </svg>
      );
    case 'sparkle':
      return (
        <svg viewBox="0 0 24 24" fill={color} style={s}>
          <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8L12 2z"/>
        </svg>
      );
    case 'shield':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={s}>
          <path d="M12 2 4 5v7c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V5l-8-3z"/>
        </svg>
      );
    default: return null;
  }
};

// Palestinian-style licence plate display
// Format: "N-NNNN-L" e.g. "7-0339-96" or "2-1139-A"
// Dark green text on cream/off-white, green "ف / P" side panel
function PlateDisplay({ plate = '7-0339-96', size = 'md' }) {
  const sizes = {
    sm: { w: 180, h: 52, fs: 22, stripW: 24, stripFs: 10 },
    md: { w: 240, h: 68, fs: 28, stripW: 32, stripFs: 13 },
    lg: { w: 280, h: 78, fs: 34, stripW: 38, stripFs: 15 },
    xl: { w: 320, h: 90, fs: 40, stripW: 42, stripFs: 17 },
  };
  const s = sizes[size];
  const PLATE_GREEN = '#1F5E3A';   // dark green ink
  const STRIP_GREEN = '#2F7A48';   // side strip
  const BG = '#EDEDE0';            // warm off-white (Palestinian plate body)

  // Split plate into parts if it fits the canonical pattern
  // Otherwise render as-is with dashes.
  const parts = (() => {
    const raw = (plate || '').trim();
    // try patterns like 7-0339-96 or 2-1139-A
    const m = raw.match(/^([A-Z0-9]{1,2})[\s\-]*([A-Z0-9]{2,5})[\s\-]*([A-Z0-9]{1,3})$/i);
    if (m) return [m[1], m[2], m[3]];
    // fallback: split on dash/space
    const bits = raw.split(/[\s\-]+/).filter(Boolean);
    if (bits.length >= 2) return bits.slice(0, 3);
    return [raw];
  })();

  return (
    <div style={{
      width: s.w, height: s.h, borderRadius: 8,
      background: BG,
      border: `2px solid ${PLATE_GREEN}`,
      boxShadow: '0 4px 12px rgba(0,0,0,0.18), inset 0 1px 2px rgba(255,255,255,0.6), inset 0 -1px 1px rgba(0,0,0,0.1)',
      position: 'relative', overflow: 'hidden',
      display: 'flex', alignItems: 'stretch',
      boxSizing: 'border-box',
    }}>
      {/* Plate number area */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: Math.max(4, s.fs * 0.15),
        fontFamily: "'JetBrains Mono', 'SF Mono', Menlo, Consolas, monospace",
        fontWeight: 700, fontSize: s.fs, color: PLATE_GREEN,
        letterSpacing: 1,
        textShadow: '0 1px 0 rgba(255,255,255,0.5)',
        paddingLeft: 8,
      }}>
        {parts.map((p, i) => (
          <React.Fragment key={i}>
            <span>{p}</span>
            {i < parts.length - 1 && (
              <span style={{
                width: Math.max(6, s.fs * 0.3),
                height: 3,
                background: PLATE_GREEN,
                borderRadius: 1,
                opacity: 0.9,
              }}/>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Right side panel with ف / P */}
      <div style={{
        width: s.stripW, background: STRIP_GREEN,
        borderLeft: `2px solid ${PLATE_GREEN}`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        color: '#F3F2E3', lineHeight: 1,
        paddingTop: 2, paddingBottom: 2,
      }}>
        <div style={{
          fontFamily: "'Amiri', 'Noto Naskh Arabic', 'Scheherazade New', serif",
          fontSize: s.stripFs + 2, fontWeight: 700,
        }}>ف</div>
        <div style={{
          fontFamily: "-apple-system, system-ui",
          fontSize: s.stripFs - 1, fontWeight: 700,
          marginTop: 1,
        }}>P</div>
      </div>

      {/* Subtle embossed highlight */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 100%)',
        pointerEvents: 'none',
      }}/>
    </div>
  );
}

// Press-feedback pressable
function Pressable({ children, onPress, style, activeStyle, disabled }) {
  const [pressed, setPressed] = React.useState(false);
  return (
    <div
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onClick={() => !disabled && onPress && onPress()}
      style={{
        cursor: disabled ? 'default' : 'pointer',
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform 120ms ease-out, opacity 120ms',
        opacity: disabled ? 0.5 : 1,
        ...style,
        ...(pressed ? activeStyle : {}),
      }}
    >
      {children}
    </div>
  );
}

// Gradient header bar used on authed screens
function GradientHeader({ title, subtitle, rightSlot, height = 140 }) {
  return (
    <div style={{
      height, width: '100%',
      background: `linear-gradient(135deg, ${T.primary} 0%, ${T.accent} 100%)`,
      paddingTop: 58, paddingLeft: 20, paddingRight: 20, paddingBottom: 18,
      boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* subtle overlay shape */}
      <div style={{
        position: 'absolute', right: -40, top: -40, width: 200, height: 200,
        borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
      }}/>
      <div style={{
        position: 'absolute', right: 40, bottom: -80, width: 140, height: 140,
        borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
      }}/>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', position: 'relative' }}>
        <div>
          {subtitle && (
            <div style={{
              fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.75)',
              letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4,
            }}>{subtitle}</div>
          )}
          <div style={{
            fontSize: 30, fontWeight: 700, color: T.white, letterSpacing: -0.5,
            lineHeight: 1.1,
          }}>{title}</div>
        </div>
        {rightSlot}
      </div>
    </div>
  );
}

// Tab bar
function TabBar({ active, onNav }) {
  const items = [
    { key: 'scan', label: 'Scan', icon: 'search' },
    { key: 'employees', label: 'People', icon: 'people' },
    { key: 'profile', label: 'Profile', icon: 'person' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingBottom: 28, paddingTop: 8,
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderTop: `1px solid ${T.border}`,
      display: 'flex', zIndex: 40,
    }}>
      {items.map(it => {
        const isActive = active === it.key;
        return (
          <Pressable key={it.key} onPress={() => onNav && onNav(it.key)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 2, padding: '4px 0' }}>
            <Icon name={it.icon} size={24}
              color={isActive ? T.primary : T.textTertiary}
              strokeWidth={isActive ? 2.4 : 2} />
            <div style={{
              fontSize: 10, fontWeight: isActive ? 700 : 500,
              color: isActive ? T.primary : T.textTertiary,
              letterSpacing: 0.2,
            }}>{it.label}</div>
          </Pressable>
        );
      })}
    </div>
  );
}

// Gate FAB (floating call-gate button)
function GateFAB({ onPress }) {
  return (
    <Pressable onPress={onPress}
      style={{
        position: 'absolute', right: 16, bottom: 104, zIndex: 30,
        background: T.primary, borderRadius: 999,
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 7,
        boxShadow: `0 6px 16px ${T.primary}66, 0 0 0 1.5px ${T.accent}`,
      }}>
      <Icon name="phone" size={15} color={T.white} strokeWidth={2.5}/>
      <span style={{ color: T.white, fontWeight: 700, fontSize: 13, letterSpacing: 0.3 }}>
        Call Gate
      </span>
    </Pressable>
  );
}

// Small avatar with initials and deterministic hue tint
function Avatar({ name = '?', size = 44, bg }) {
  const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue = bg || `hsl(${(hash * 37) % 360}, 45%, 55%)`;
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2,
      background: hue, color: T.white, fontWeight: 700,
      fontSize: size * 0.4, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, letterSpacing: -0.5,
    }}>{initials}</div>
  );
}

Object.assign(window, { T, Icon, PlateDisplay, Pressable, GradientHeader, TabBar, GateFAB, Avatar });
