import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { theme } from '../../constants/theme';
import { PlateInput } from '../../components/PlateInput';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { isValidPlate, normalizePlate, formatPlate } from '../../utils/plateParser';

export default function ProfileScreen() {
  const { authState, signOut, setHasPlate } = useAuth();
  const user = authState.status === 'authenticated' ? authState.user : null;

  const [currentPlate, setCurrentPlate] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [plateError, setPlateError] = useState('');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    api.getMyPlates().then((plates) => {
      const active = plates.find((p) => p.isActive);
      if (active) setCurrentPlate(active.plateNumber);
    }).catch(() => {});
  }, []);

  async function handleSavePlate() {
    if (!isValidPlate(newPlate)) {
      setPlateError('Please enter a valid plate.');
      return;
    }
    setSaving(true);
    setPlateError('');
    try {
      const saved = await api.registerPlate(normalizePlate(newPlate));
      setCurrentPlate(saved.plateNumber);
      setHasPlate(true);
      setEditing(false);
      setNewPlate('');
    } catch (err: any) {
      setPlateError(err.message ?? 'Failed to save plate.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSyncBamboo() {
    setSyncing(true);
    try {
      const { result } = await api.syncBamboo();
      Alert.alert(
        'Sync Complete',
        `Inserted: ${result.inserted}\nUpdated: ${result.updated}\nLinked: ${result.linked}\nDeactivated: ${result.deactivated}`
      );
    } catch (err: any) {
      Alert.alert('Sync Failed', err.message ?? 'Unknown error');
    } finally {
      setSyncing(false);
    }
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Avatar + name */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.displayName?.charAt(0).toUpperCase() ?? '?'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.displayName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Plate section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>My Licence Plate</Text>

        {!editing ? (
          <View style={styles.plateRow}>
            <Text style={styles.plateText}>
              {currentPlate ? formatPlate(currentPlate) : 'No plate registered'}
            </Text>
            <TouchableOpacity onPress={() => { setEditing(true); setNewPlate(''); }}>
              <Text style={styles.editLink}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.editSection}>
            <PlateInput value={newPlate} onChange={setNewPlate} error={plateError} />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => { setEditing(false); setNewPlate(''); setPlateError(''); }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, (!isValidPlate(newPlate) || saving) && styles.buttonDisabled]}
                onPress={handleSavePlate}
                disabled={!isValidPlate(newPlate) || saving}
              >
                {saving
                  ? <ActivityIndicator color={theme.colors.white} size="small" />
                  : <Text style={styles.saveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Admin: BambooHR sync */}
      <TouchableOpacity style={styles.syncButton} onPress={handleSyncBamboo} disabled={syncing}>
        {syncing
          ? <ActivityIndicator color={theme.colors.primary} size="small" />
          : <Text style={styles.syncText}>Sync BambooHR</Text>}
      </TouchableOpacity>

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.white },
  content: { padding: 24, gap: 20 },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: theme.colors.white },
  name: { fontSize: 22, fontWeight: '700', color: theme.colors.dark },
  email: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 4 },

  card: {
    backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg,
    padding: 20, gap: 12,
  },
  cardTitle: { fontSize: 13, fontWeight: '600', color: theme.colors.dark, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 1 },
  plateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  plateText: { fontSize: 22, fontWeight: '800', color: theme.colors.dark, letterSpacing: 3 },
  editLink: { fontSize: 15, color: theme.colors.primary, fontWeight: '600' },

  editSection: { gap: 12 },
  editActions: { flexDirection: 'row', gap: 12 },
  cancelButton: {
    flex: 1, paddingVertical: 12, borderRadius: theme.radius.md,
    borderWidth: 1.5, borderColor: theme.colors.border, alignItems: 'center',
  },
  cancelText: { color: theme.colors.dark, fontWeight: '600' },
  saveButton: {
    flex: 1, paddingVertical: 12, borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary, alignItems: 'center',
  },
  saveText: { color: theme.colors.white, fontWeight: '600' },
  buttonDisabled: { opacity: 0.5 },

  syncButton: {
    paddingVertical: 16, borderRadius: theme.radius.md,
    borderWidth: 1.5, borderColor: theme.colors.primary, alignItems: 'center',
  },
  syncText: { color: theme.colors.primary, fontSize: 16, fontWeight: '600' },

  signOutButton: {
    paddingVertical: 16, borderRadius: theme.radius.md,
    borderWidth: 1.5, borderColor: theme.colors.error, alignItems: 'center',
  },
  signOutText: { color: theme.colors.error, fontSize: 16, fontWeight: '600' },
});
