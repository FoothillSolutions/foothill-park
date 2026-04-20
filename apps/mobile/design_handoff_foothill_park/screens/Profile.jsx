// Profile screen

function ProfileScreen({ user, plate, onSignOut, onGate, onNav, onUpdatePlate }) {
  const [editing, setEditing] = React.useState(false);
  const [newPlate, setNewPlate] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [syncMsg, setSyncMsg] = React.useState(null);

  function startEdit() { setEditing(true); setNewPlate(plate); }
  function cancel() { setEditing(false); setNewPlate(''); }
  async function save() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 550));
    setSaving(false); setEditing(false);
    onUpdatePlate && onUpdatePlate(newPlate.trim());
  }
  async function syncBamboo() {
    setSyncing(true); setSyncMsg(null);
    await new Promise(r => setTimeout(r, 900));
    setSyncing(false);
    setSyncMsg({ inserted: 3, updated: 12, linked: 48, deactivated: 1 });
    setTimeout(() => setSyncMsg(null), 4000);
  }

  return (
    <div style={{
      width: '100%', height: '100%', background: T.surface,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      position: 'relative',
    }}>
      <GradientHeader title="My Profile" subtitle="Account" height={150}/>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 140px', marginTop: -50 }}>
        {/* Identity card */}
        <div style={{
          background: T.white, borderRadius: 22, padding: 22,
          boxShadow: '0 10px 28px rgba(30,50,90,0.08)',
          border: `1px solid ${T.border}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          marginBottom: 16,
        }}>
          <Avatar name={user.displayName} size={78}/>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.dark, marginTop: 12, letterSpacing: -0.3 }}>
            {user.displayName}
          </div>
          <div style={{ fontSize: 13, color: T.textSecondary, marginTop: 3 }}>
            {user.email}
          </div>
          <div style={{
            marginTop: 10, padding: '4px 10px', borderRadius: 6,
            background: T.success + '18', color: T.success,
            fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: T.success }}/>
            Active employee
          </div>
        </div>

        {/* Plate card */}
        <div style={{
          background: T.white, borderRadius: 22, padding: 20,
          border: `1px solid ${T.border}`,
          boxShadow: '0 2px 6px rgba(30,50,90,0.03)',
          marginBottom: 16,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 1.2,
              color: T.textSecondary, textTransform: 'uppercase',
            }}>My licence plate</div>
            {!editing && (
              <Pressable onPress={startEdit} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 10px', borderRadius: 8, background: T.primary + '14',
              }}>
                <Icon name="edit" size={13} color={T.primary} strokeWidth={2.5}/>
                <span style={{ fontSize: 13, color: T.primary, fontWeight: 600 }}>Change</span>
              </Pressable>
            )}
          </div>

          {!editing ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0 6px' }}>
              <PlateDisplay plate={plate} size="lg"/>
            </div>
          ) : (
            <div>
              <div style={{
                borderRadius: 12, padding: 2,
                background: `linear-gradient(135deg, ${T.primary}, ${T.accent})`,
                marginBottom: 12,
              }}>
                <input
                  value={newPlate}
                  onChange={e => setNewPlate(e.target.value.replace(/[^A-Za-z0-9\s\-]/g, '').toUpperCase())}
                  style={{
                    width: '100%', boxSizing: 'border-box', border: 'none', outline: 'none',
                    padding: '14px 16px',
                    borderRadius: 10, background: T.white,
                    fontSize: 22, fontWeight: 700, color: T.dark, letterSpacing: 3,
                    fontFamily: "'SF Mono', Menlo, monospace",
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Pressable onPress={cancel} style={{
                  flex: 1, height: 46, borderRadius: 12,
                  border: `1.5px solid ${T.border}`, background: T.white,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ color: T.dark, fontWeight: 600, fontSize: 14 }}>Cancel</span>
                </Pressable>
                <Pressable onPress={save} disabled={saving || newPlate.length < 3} style={{
                  flex: 1, height: 46, borderRadius: 12, background: T.primary,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {saving
                    ? <LoadingDots color={T.white}/>
                    : <span style={{ color: T.white, fontWeight: 600, fontSize: 14 }}>Save</span>}
                </Pressable>
              </div>
            </div>
          )}
        </div>

        {/* Admin: BambooHR */}
        <div style={{ marginBottom: 12 }}>
          <Pressable onPress={syncBamboo} disabled={syncing} style={{
            background: T.white, borderRadius: 16, padding: '14px 16px',
            border: `1.5px solid ${T.primary}`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: T.primary + '14',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="bamboo" size={18} color={T.primary}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.primary }}>
                {syncing ? 'Syncing…' : 'Sync BambooHR'}
              </div>
              <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 2 }}>
                Pulls latest employees & plates
              </div>
            </div>
            {syncing ? (
              <div style={{
                width: 20, height: 20, borderRadius: 10,
                border: `2px solid ${T.border}`, borderTopColor: T.primary,
                animation: 'spin 900ms linear infinite',
              }}/>
            ) : <Icon name="chevron" size={18} color={T.textTertiary}/>}
          </Pressable>
          {syncMsg && (
            <div style={{
              marginTop: 8, background: T.success + '14', border: `1px solid ${T.success}33`,
              color: T.success, borderRadius: 12, padding: '10px 14px',
              fontSize: 12, fontWeight: 600, display: 'flex', gap: 12, flexWrap: 'wrap',
            }}>
              <span>✓ Inserted {syncMsg.inserted}</span>
              <span>Updated {syncMsg.updated}</span>
              <span>Linked {syncMsg.linked}</span>
              <span>Deactivated {syncMsg.deactivated}</span>
            </div>
          )}
        </div>

        {/* Sign out */}
        <Pressable onPress={onSignOut} style={{
          background: T.white, borderRadius: 16, padding: '14px 16px',
          border: `1.5px solid ${T.error}55`,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: T.error + '14',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="logout" size={18} color={T.error}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.error }}>Sign out</div>
            <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 2 }}>
              You'll need to sign in again
            </div>
          </div>
          <Icon name="chevron" size={18} color={T.textTertiary}/>
        </Pressable>

        <div style={{
          marginTop: 22, textAlign: 'center',
          fontSize: 11, color: T.textTertiary, letterSpacing: 0.3,
        }}>
          Foothill Park · v1.0 · Internal build
        </div>
      </div>

      <GateFAB onPress={onGate}/>
      <TabBar active="profile" onNav={onNav}/>
    </div>
  );
}

Object.assign(window, { ProfileScreen });
