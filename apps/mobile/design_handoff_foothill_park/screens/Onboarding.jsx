// Onboarding / Register Plate screen

function OnboardingScreen({ onSubmit }) {
  const [plate, setPlate] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const isValid = plate.trim().length >= 5;

  function handleChange(e) {
    const cleaned = e.target.value.replace(/[^A-Za-z0-9\s\-]/g, '').toUpperCase();
    setPlate(cleaned);
    if (error) setError('');
  }

  async function handleSubmit() {
    if (!isValid) {
      setError('Please enter a valid licence plate.');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 650));
    setLoading(false);
    onSubmit && onSubmit(plate);
  }

  return (
    <div style={{
      width: '100%', height: '100%', background: T.white,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Top gradient band with step indicator */}
      <div style={{
        paddingTop: 58, paddingBottom: 24, paddingLeft: 24, paddingRight: 24,
        background: `linear-gradient(135deg, ${T.primary} 0%, ${T.accent} 100%)`,
        color: T.white,
      }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 22 }}>
          <div style={{ flex: 1, height: 4, borderRadius: 2, background: T.white }}/>
          <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.3)' }}/>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>
          STEP 1 OF 2
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1.15 }}>
          Register your<br/>licence plate
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 20px 140px' }}>
        {/* Why card */}
        <div style={{
          background: T.surface, borderRadius: 18, padding: 16,
          display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 28,
          border: `1px solid ${T.border}`,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: T.primary + '14', color: T.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="shield" size={20} color={T.primary}/>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: T.dark, marginBottom: 3 }}>
              Why do we need this?
            </div>
            <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.5 }}>
              Teammates can reach you too when your car is in the way.
            </div>
          </div>
        </div>

        {/* Plate preview (live) */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <PlateDisplay plate={plate.trim() || '— — — — —'} size="lg"/>
        </div>

        {/* Input */}
        <div style={{ marginBottom: 8 }}>
          <label style={{
            display: 'block', fontSize: 12, fontWeight: 700, letterSpacing: 1.2,
            color: T.textSecondary, textTransform: 'uppercase', marginBottom: 8,
          }}>Your licence plate</label>
          <div style={{
            position: 'relative',
            borderRadius: 14, padding: 2,
            background: error
              ? T.error
              : isValid
                ? `linear-gradient(135deg, ${T.primary}, ${T.accent})`
                : T.border,
          }}>
            <input
              value={plate}
              onChange={handleChange}
              placeholder="e.g. 7-0339-96"
              style={{
                width: '100%', boxSizing: 'border-box',
                border: 'none', outline: 'none',
                padding: '16px 48px 16px 16px',
                borderRadius: 12, background: T.white,
                fontSize: 22, fontWeight: 700, color: T.dark, letterSpacing: 3,
                fontFamily: "'SF Mono', Menlo, monospace",
              }}
            />
            {isValid && !error && (
              <div style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                width: 26, height: 26, borderRadius: 13, background: T.success,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="check" size={15} color={T.white} strokeWidth={3}/>
              </div>
            )}
          </div>
          {error ? (
            <div style={{ marginTop: 8, fontSize: 13, color: T.error, fontWeight: 500 }}>{error}</div>
          ) : isValid ? (
            <div style={{ marginTop: 8, fontSize: 13, color: T.success, fontWeight: 500 }}>
              Looks good — ready to register
            </div>
          ) : (
            <div style={{ marginTop: 8, fontSize: 13, color: T.textTertiary }}>
              Letters, numbers, dashes only
            </div>
          )}
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        padding: '14px 20px 34px', background: `linear-gradient(180deg, rgba(255,255,255,0) 0%, ${T.white} 30%)`,
      }}>
        <Pressable onPress={handleSubmit} disabled={!isValid || loading}
          style={{
            background: T.primary, height: 56, borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            boxShadow: `0 8px 20px ${T.primary}40`,
          }}>
          {loading ? (
            <LoadingDots color={T.white}/>
          ) : (
            <>
              <span style={{ color: T.white, fontWeight: 600, fontSize: 16 }}>
                Register & continue
              </span>
              <Icon name="arrow-right" size={18} color={T.white} strokeWidth={2.5}/>
            </>
          )}
        </Pressable>
        <div style={{
          textAlign: 'center', marginTop: 10,
          fontSize: 12, color: T.textTertiary,
        }}>You can change this any time in your profile</div>
      </div>
    </div>
  );
}

Object.assign(window, { OnboardingScreen });
