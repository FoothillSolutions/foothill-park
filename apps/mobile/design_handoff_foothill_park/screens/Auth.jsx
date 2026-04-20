// Login + Auth-callback screens (both use primary→dark gradient)

function LoginScreen({ onSignIn, loading }) {
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      background: `linear-gradient(160deg, ${T.primary} 0%, #244E86 45%, ${T.dark} 100%)`,
      color: T.white, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* decorative orbs */}
      <div style={{
        position: 'absolute', width: 340, height: 340, borderRadius: '50%',
        background: `radial-gradient(circle, ${T.accent}40 0%, transparent 70%)`,
        top: -120, right: -100, filter: 'blur(10px)',
      }}/>
      <div style={{
        position: 'absolute', width: 280, height: 280, borderRadius: '50%',
        background: `radial-gradient(circle, ${T.primary}66 0%, transparent 70%)`,
        bottom: 80, left: -120, filter: 'blur(14px)',
      }}/>

      {/* Brand mark in top-right corner */}
      <div style={{
        position: 'absolute', top: 62, right: 20,
        fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.55)',
        letterSpacing: 1.5, textTransform: 'uppercase',
      }}>v1.0 · internal</div>

      {/* Centered hero */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '80px 32px 40px', position: 'relative',
      }}>
        {/* Logo mark */}
        <div style={{
          width: 88, height: 88, borderRadius: 24,
          background: 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 32,
          boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
        }}>
          <Icon name="car" size={44} color={T.white} strokeWidth={2}/>
        </div>

        <div style={{
          fontSize: 14, fontWeight: 600, color: T.accent,
          letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10,
        }}>Foothill Park</div>

        <div style={{
          fontSize: 36, fontWeight: 700, color: T.white,
          letterSpacing: -0.8, lineHeight: 1.05, textAlign: 'center',
          marginBottom: 14, textWrap: 'balance',
        }}>Park smarter.<br/>Move faster.</div>

        <div style={{
          fontSize: 15, color: 'rgba(255,255,255,0.7)',
          textAlign: 'center', lineHeight: 1.45, maxWidth: 280,
        }}>
          Find the person behind any plate on the Foothill lot in seconds.
        </div>
      </div>

      {/* Bottom: SSO button */}
      <div style={{ padding: '0 20px 56px' }}>
        <Pressable onPress={onSignIn} disabled={loading}
          style={{
            background: T.white, borderRadius: 16, height: 58,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          }}>
          {loading ? (
            <LoadingDots color={T.primary}/>
          ) : (
            <>
              <Icon name="microsoft" size={22}/>
              <span style={{ color: T.dark, fontWeight: 600, fontSize: 16, letterSpacing: -0.2 }}>
                Sign in with Microsoft
              </span>
            </>
          )}
        </Pressable>

        <div style={{
          marginTop: 18, textAlign: 'center',
          fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.3,
        }}>
          Foothill Technology Solutions · SSO secured
        </div>
      </div>
    </div>
  );
}

function LoadingDots({ color = '#fff' }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 8, height: 8, borderRadius: 4, background: color,
          animation: `dotPulse 1.2s ${i * 0.15}s infinite ease-in-out`,
        }}/>
      ))}
    </div>
  );
}

function AuthCallbackScreen() {
  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      background: `linear-gradient(160deg, ${T.primary} 0%, #244E86 45%, ${T.dark} 100%)`,
      color: T.white,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 28, padding: 40, boxSizing: 'border-box',
    }}>
      {/* same deco orbs to match login */}
      <div style={{
        position: 'absolute', width: 340, height: 340, borderRadius: '50%',
        background: `radial-gradient(circle, ${T.accent}40 0%, transparent 70%)`,
        top: -120, right: -100, filter: 'blur(10px)',
      }}/>

      <div style={{
        width: 88, height: 88, borderRadius: 24,
        background: 'rgba(255,255,255,0.12)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 10px 40px rgba(0,0,0,0.25)', position: 'relative', zIndex: 1,
      }}>
        <Icon name="car" size={44} color={T.white} strokeWidth={2}/>
      </div>

      {/* circular spinner */}
      <div style={{ position: 'relative', width: 44, height: 44, zIndex: 1 }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: '3px solid rgba(255,255,255,0.15)',
          borderTopColor: T.white,
          animation: 'spin 900ms linear infinite',
        }}/>
      </div>

      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <div style={{ fontSize: 19, fontWeight: 600, color: T.white, marginBottom: 6 }}>
          Signing you in…
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
          Verifying your Foothill credentials
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LoginScreen, AuthCallbackScreen, LoadingDots });
