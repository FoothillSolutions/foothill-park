// Scan screen — camera view + manual entry + result card

function ScanScreen({ initialResult, onOpenCamera, onGate, onNav }) {
  const [plate, setPlate] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState(initialResult || null);
  const [error, setError] = React.useState('');

  React.useEffect(() => { setResult(initialResult || null); }, [initialResult]);

  const isValid = plate.trim().length >= 5;

  function handleChange(e) {
    const cleaned = e.target.value.replace(/[^A-Za-z0-9\s\-]/g, '').toUpperCase();
    setPlate(cleaned);
    if (error) setError('');
  }

  async function handleLookup() {
    if (!isValid) return;
    setLoading(true);
    setResult(null);
    await new Promise(r => setTimeout(r, 700));
    setLoading(false);
    // Demo result
    setResult({
      plate: plate.toUpperCase(),
      found: true,
      owner: {
        displayName: 'Maya Patel',
        department: 'Engineering · Platform',
        phone: '+1 805 555 0132',
        discordId: 'maya.p',
      },
    });
  }

  function handleReset() { setPlate(''); setResult(null); setError(''); }

  return (
    <div style={{
      width: '100%', height: '100%', background: T.surface,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      position: 'relative',
    }}>
      <GradientHeader
        subtitle="Quick look-up"
        title={<>Which car is<br/>blocking you?</>}
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 16px 150px' }}>
        {!result && !loading && (
          <>
            {/* Primary camera action */}
            <Pressable onPress={onOpenCamera}
              style={{
                background: T.white, borderRadius: 20, padding: 20,
                border: `1px solid ${T.border}`,
                boxShadow: '0 2px 10px rgba(30,50,90,0.04)',
                display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20,
              }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 6px 14px ${T.primary}40`,
              }}>
                <Icon name="camera" size={26} color={T.white} strokeWidth={2}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: T.dark, marginBottom: 2 }}>
                  Scan with camera
                </div>
                <div style={{ fontSize: 13, color: T.textSecondary }}>
                  Point at the plate — we'll read it
                </div>
              </div>
              <Icon name="chevron" size={18} color={T.textTertiary}/>
            </Pressable>

            {/* OR divider */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 18px',
            }}>
              <div style={{ flex: 1, height: 1, background: T.border }}/>
              <div style={{
                fontSize: 11, fontWeight: 600, color: T.textTertiary,
                letterSpacing: 1.5, textTransform: 'uppercase',
              }}>Or enter manually</div>
              <div style={{ flex: 1, height: 1, background: T.border }}/>
            </div>

            {/* Manual plate input */}
            <div style={{
              background: T.white, borderRadius: 20, padding: 18,
              border: `1px solid ${T.border}`,
              boxShadow: '0 2px 10px rgba(30,50,90,0.04)',
            }}>
              <label style={{
                display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: 1.2,
                color: T.textSecondary, textTransform: 'uppercase', marginBottom: 10,
              }}>Plate number</label>
              <div style={{
                borderRadius: 12, padding: 2,
                background: isValid
                  ? `linear-gradient(135deg, ${T.primary}, ${T.accent})`
                  : T.border,
                marginBottom: 14,
              }}>
                <input
                  value={plate}
                  onChange={handleChange}
                  placeholder="e.g. 7-0339-96"
                  style={{
                    width: '100%', boxSizing: 'border-box', border: 'none', outline: 'none',
                    padding: '14px 16px',
                    borderRadius: 10, background: T.white,
                    fontSize: 22, fontWeight: 700, color: T.dark, letterSpacing: 3,
                    fontFamily: "'SF Mono', Menlo, monospace",
                  }}
                />
              </div>
              <Pressable onPress={handleLookup} disabled={!isValid}
                style={{
                  background: T.accent, height: 52, borderRadius: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                <Icon name="search" size={18} color={T.white} strokeWidth={2.5}/>
                <span style={{ color: T.white, fontSize: 16, fontWeight: 600 }}>
                  Look up owner
                </span>
              </Pressable>
            </div>

            {/* Recent hint */}
            <div style={{
              marginTop: 22, padding: '0 4px',
              fontSize: 12, color: T.textTertiary, textAlign: 'center',
            }}>Tip: use the camera in low light — the flash stays off</div>
          </>
        )}

        {loading && (
          <div style={{
            background: T.white, borderRadius: 24, padding: 40,
            boxShadow: '0 4px 14px rgba(30,50,90,0.05)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          }}>
            <div style={{ position: 'relative', width: 60, height: 60 }}>
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                border: `4px solid ${T.border}`,
                borderTopColor: T.primary,
                animation: 'spin 900ms linear infinite',
              }}/>
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: T.dark }}>
              Searching Foothill roster…
            </div>
          </div>
        )}

        {result && (
          <ResultCard result={result} onReset={handleReset}/>
        )}
      </div>

      <GateFAB onPress={onGate}/>
      <TabBar active="scan" onNav={onNav}/>
    </div>
  );
}

function ResultCard({ result, onReset }) {
  const found = result.found;
  return (
    <div style={{
      background: T.white, borderRadius: 24, overflow: 'hidden',
      boxShadow: '0 10px 30px rgba(30,50,90,0.12)',
      animation: 'slideUp 350ms ease-out',
      border: `1px solid ${T.border}`,
    }}>
      {/* Hero plate */}
      <div style={{
        padding: '24px 20px 20px',
        background: `linear-gradient(135deg, ${T.primary}14, ${T.accent}0A)`,
        borderBottom: `1px solid ${T.border}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
          color: found ? T.success : T.error, textTransform: 'uppercase', marginBottom: 10,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: 3,
            background: found ? T.success : T.error,
            boxShadow: `0 0 0 4px ${(found ? T.success : T.error)}22`,
          }}/>
          {found ? 'Match found' : 'Not registered'}
        </div>
        <PlateDisplay plate={result.plate || 'ABC-1234'} size="lg"/>
      </div>

      {found ? (
        <>
          <div style={{ padding: '22px 20px 4px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar name={result.owner.displayName} size={56}/>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: T.dark, letterSpacing: -0.3 }}>
                {result.owner.displayName}
              </div>
              {result.owner.department && (
                <div style={{ fontSize: 13, color: T.textSecondary, marginTop: 2 }}>
                  {result.owner.department}
                </div>
              )}
            </div>
          </div>

          <div style={{ padding: '18px 16px 18px', display: 'flex', gap: 10 }}>
            {result.owner.phone && (
              <Pressable style={{
                flex: 1, height: 52, borderRadius: 14,
                background: T.primary,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: `0 6px 14px ${T.primary}33`,
              }}>
                <Icon name="phone" size={18} color={T.white} strokeWidth={2.5}/>
                <span style={{ color: T.white, fontWeight: 700, fontSize: 15 }}>
                  Call
                </span>
              </Pressable>
            )}
            {result.owner.discordId && (
              <Pressable style={{
                flex: 1, height: 52, borderRadius: 14,
                background: T.discord,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: `0 6px 14px ${T.discord}33`,
              }}>
                <Icon name="discord" size={18} color={T.white}/>
                <span style={{ color: T.white, fontWeight: 700, fontSize: 15 }}>
                  Discord
                </span>
              </Pressable>
            )}
          </div>
        </>
      ) : (
        <div style={{ padding: '28px 20px 20px', textAlign: 'center' }}>
          <div style={{
            width: 60, height: 60, borderRadius: 30,
            background: T.error + '14', margin: '0 auto 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="close" size={28} color={T.error}/>
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.dark, marginBottom: 4 }}>
            No employee found
          </div>
          <div style={{ fontSize: 14, color: T.textSecondary }}>
            The car may belong to a visitor.
          </div>
        </div>
      )}

      <Pressable onPress={onReset} style={{
        borderTop: `1px solid ${T.border}`, padding: '16px 20px',
        textAlign: 'center',
      }}>
        <span style={{ color: T.primary, fontSize: 15, fontWeight: 600 }}>
          Search another plate
        </span>
      </Pressable>
    </div>
  );
}

// Full-screen camera view
function CameraView({ onClose, onDetect }) {
  const [scanning, setScanning] = React.useState(false);

  function capture() {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      onDetect && onDetect({ plate: '7-0339-96' });
    }, 1600);
  }

  return (
    <div style={{
      width: '100%', height: '100%', position: 'relative',
      background: '#0A0A15', overflow: 'hidden', color: T.white,
    }}>
      {/* Simulated camera feed: moody concrete + car silhouette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse at 50% 80%, #1d2538 0%, #0a0f1f 60%),
          linear-gradient(180deg, #141a2b 0%, #0a0f1f 100%)
        `,
      }}>
        {/* ground stripes */}
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            position: 'absolute', left: `${20 + i * 20}%`, bottom: 0, width: 2, height: '45%',
            background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.1) 100%)',
            transform: `skew(${-5 + i * 5}deg)`,
          }}/>
        ))}
        {/* car hint */}
        <div style={{
          position: 'absolute', left: '50%', top: '48%',
          transform: 'translate(-50%, -50%)',
          width: 220, height: 90,
          background: 'linear-gradient(180deg, #2a3550 0%, #1a2238 100%)',
          borderRadius: '30% 30% 10% 10% / 55% 55% 10% 10%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}/>
      </div>

      {/* Dark overlay with cutout frame */}
      <div style={{ position: 'absolute', inset: 0 }}>
        {/* top */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 'calc(50% - 75px)', background: 'rgba(0,0,0,0.62)' }}/>
        {/* bottom */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 'calc(50% - 75px)', background: 'rgba(0,0,0,0.62)' }}/>
        {/* left */}
        <div style={{ position: 'absolute', top: 'calc(50% - 75px)', bottom: 'calc(50% - 75px)', left: 0, width: 'calc(50% - 150px)', background: 'rgba(0,0,0,0.62)' }}/>
        {/* right */}
        <div style={{ position: 'absolute', top: 'calc(50% - 75px)', bottom: 'calc(50% - 75px)', right: 0, width: 'calc(50% - 150px)', background: 'rgba(0,0,0,0.62)' }}/>

        {/* corner brackets */}
        <div style={{
          position: 'absolute', left: 'calc(50% - 150px)', top: 'calc(50% - 75px)',
          width: 300, height: 150, pointerEvents: 'none',
        }}>
          {[
            { top: 0, left: 0, bt: 4, bl: 4 },
            { top: 0, right: 0, bt: 4, br: 4 },
            { bottom: 0, left: 0, bb: 4, bl: 4 },
            { bottom: 0, right: 0, bb: 4, br: 4 },
          ].map((c, i) => (
            <div key={i} style={{
              position: 'absolute', width: 32, height: 32,
              borderColor: scanning ? T.success : T.white,
              borderTopWidth: c.bt || 0, borderLeftWidth: c.bl || 0,
              borderRightWidth: c.br || 0, borderBottomWidth: c.bb || 0,
              borderStyle: 'solid', borderRadius: 4,
              top: c.top, left: c.left, right: c.right, bottom: c.bottom,
              boxShadow: scanning ? `0 0 16px ${T.success}aa` : 'none',
              transition: 'all 200ms',
            }}/>
          ))}
          {/* scan line */}
          {scanning && (
            <div style={{
              position: 'absolute', left: 6, right: 6, height: 2,
              background: `linear-gradient(90deg, transparent, ${T.success}, transparent)`,
              boxShadow: `0 0 12px ${T.success}`,
              animation: 'scanLine 1.4s linear infinite',
            }}/>
          )}
        </div>
      </div>

      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 58, left: 16, right: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Pressable onPress={onClose} style={{
          width: 44, height: 44, borderRadius: 22,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <Icon name="close" size={22} color={T.white}/>
        </Pressable>
        <div style={{
          padding: '8px 14px', borderRadius: 999,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
          fontSize: 12, fontWeight: 600, color: T.white,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Icon name="sparkle" size={12} color={T.accent}/>
          OCR on-device
        </div>
      </div>

      {/* Hint pill */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 'calc(50% + 100px)',
        display: 'flex', justifyContent: 'center',
      }}>
        <div style={{
          padding: '8px 16px', borderRadius: 999,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          fontSize: 13, fontWeight: 600, color: T.white,
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          {scanning ? 'Reading plate…' : 'Aim at the licence plate'}
        </div>
      </div>

      {/* Bottom controls */}
      <div style={{
        position: 'absolute', bottom: 48, left: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 60,
      }}>
        <Pressable onPress={capture} disabled={scanning}
          style={{
            width: 76, height: 76, borderRadius: 38,
            background: scanning ? T.success : T.primary,
            border: '4px solid rgba(255,255,255,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            transition: 'background 200ms',
          }}>
          {scanning ? (
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              border: '3px solid rgba(255,255,255,0.3)',
              borderTopColor: T.white,
              animation: 'spin 900ms linear infinite',
            }}/>
          ) : (
            <Icon name="camera" size={30} color={T.white} strokeWidth={2}/>
          )}
        </Pressable>
      </div>
    </div>
  );
}

Object.assign(window, { ScanScreen, CameraView, ResultCard });
