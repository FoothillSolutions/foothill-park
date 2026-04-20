// Employees list

const DEMO_EMPLOYEES = [
  { id: '1', displayName: 'Maya Patel', department: 'Engineering · Platform', phone: '+18055550132', discordId: 'maya.p' },
  { id: '2', displayName: 'Daniel Rivera', department: 'Operations', phone: '+18055550118', discordId: 'drivera' },
  { id: '3', displayName: 'Priya Shah', department: 'Product Design', phone: '+18055550104', discordId: 'priyas' },
  { id: '4', displayName: 'Jordan Lee', department: 'Data & Analytics', phone: null, discordId: 'jlee' },
  { id: '5', displayName: 'Sofia Hernandez', department: 'People & Culture', phone: '+18055550166', discordId: null },
  { id: '6', displayName: 'Wes Okafor', department: 'Engineering · Infra', phone: '+18055550143', discordId: 'wes' },
  { id: '7', displayName: 'Aria Chen', department: 'Finance', phone: '+18055550172', discordId: 'aria.c' },
  { id: '8', displayName: 'Marcus Hale', department: 'Customer Success', phone: '+18055550198', discordId: 'mhale' },
  { id: '9', displayName: 'Nika Volkov', department: 'Engineering · Mobile', phone: '+18055550121', discordId: 'nika' },
  { id: '10', displayName: 'Theo Ramirez', department: 'Security', phone: '+18055550109', discordId: null },
];

function EmployeesScreen({ onGate, onNav }) {
  const [search, setSearch] = React.useState('');
  const filtered = DEMO_EMPLOYEES.filter(e =>
    e.displayName.toLowerCase().includes(search.toLowerCase()) ||
    (e.department || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      width: '100%', height: '100%', background: T.surface,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      position: 'relative',
    }}>
      <GradientHeader
        subtitle={`${DEMO_EMPLOYEES.length} Teammates`}
        title="People"
        rightSlot={
          <div style={{
            width: 44, height: 44, borderRadius: 22,
            background: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="people" size={20} color={T.white} strokeWidth={2}/>
          </div>
        }
      />

      {/* Sticky search */}
      <div style={{
        padding: '14px 16px 10px', background: T.surface,
        position: 'sticky', top: 0, zIndex: 5,
      }}>
        <div style={{
          background: T.white, borderRadius: 14,
          border: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 14px',
        }}>
          <Icon name="search" size={18} color={T.textTertiary}/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or department…"
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 15, color: T.dark,
              fontFamily: '-apple-system, system-ui',
            }}
          />
          {search && (
            <Pressable onPress={() => setSearch('')} style={{
              width: 20, height: 20, borderRadius: 10, background: T.border,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="close" size={12} color={T.white} strokeWidth={3}/>
            </Pressable>
          )}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 140px' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: T.textTertiary }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>No matches</div>
            <div style={{ fontSize: 13 }}>Try a different name or team</div>
          </div>
        )}
        {filtered.map(emp => (
          <div key={emp.id} style={{
            background: T.white, borderRadius: 18, padding: '14px 14px',
            marginBottom: 10, border: `1px solid ${T.border}`,
            boxShadow: '0 1px 2px rgba(30,50,90,0.03)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <Avatar name={emp.displayName} size={46}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.dark, letterSpacing: -0.2 }}>
                {emp.displayName}
              </div>
              {emp.department && (
                <div style={{
                  display: 'inline-block', marginTop: 4,
                  fontSize: 11, color: T.primary, fontWeight: 600,
                  background: T.primary + '14', padding: '2px 8px', borderRadius: 6,
                  letterSpacing: 0.2,
                }}>{emp.department}</div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' }}>
              {emp.phone ? (
                <Pressable style={{
                  background: T.primary, borderRadius: 999,
                  padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <Icon name="phone" size={12} color={T.white} strokeWidth={2.5}/>
                  <span style={{ color: T.white, fontSize: 11, fontWeight: 700 }}>Call</span>
                </Pressable>
              ) : (
                <div style={{ fontSize: 10, color: T.textTertiary, padding: '6px 0' }}>No phone</div>
              )}
              {emp.discordId && (
                <Pressable style={{
                  background: T.discord, borderRadius: 999,
                  padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <Icon name="discord" size={12} color={T.white}/>
                  <span style={{ color: T.white, fontSize: 11, fontWeight: 700 }}>
                    {emp.discordId}
                  </span>
                </Pressable>
              )}
            </div>
          </div>
        ))}
      </div>

      <GateFAB onPress={onGate}/>
      <TabBar active="employees" onNav={onNav}/>
    </div>
  );
}

Object.assign(window, { EmployeesScreen, DEMO_EMPLOYEES });
