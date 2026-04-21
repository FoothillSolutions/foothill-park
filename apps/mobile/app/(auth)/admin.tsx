import { useState } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  Alert, ScrollView, StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';

export default function AdminScreen() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);

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

  return (
    <View style={styles.container}>
      {/* Gradient header */}
      <LinearGradient
        colors={['#2D6DB5', '#5BA4E6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>INTERNAL</Text>
            <Text style={styles.headerTitle}>Admin Panel</Text>
          </View>
          <View style={styles.headerIconWrapper}>
            <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body}>
        {/* BambooHR sync card */}
        <Text style={styles.sectionLabel}>INTEGRATIONS</Text>

        <TouchableOpacity
          style={styles.card}
          onPress={handleSyncBamboo}
          disabled={syncing}
          activeOpacity={0.7}
        >
          <View style={styles.iconTile}>
            <Ionicons name="leaf" size={22} color="#2D6DB5" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{syncing ? 'Syncing…' : 'Sync BambooHR'}</Text>
            <Text style={styles.cardSub}>Pull latest employees, phones &amp; departments</Text>
          </View>
          {syncing
            ? <ActivityIndicator color="#2D6DB5" size="small" />
            : <Ionicons name="chevron-forward" size={18} color="#9AA5B8" />}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F8FC' },

  header: {
    height: 140,
    paddingTop: 54,
    paddingBottom: 18,
    paddingHorizontal: 20,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute', right: -40, top: -40,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  decorCircle2: {
    position: 'absolute', right: 40, bottom: -80,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  eyebrow: {
    fontSize: 13, fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4,
  },
  headerTitle: {
    fontSize: 30, fontWeight: '700',
    color: '#FFFFFF', letterSpacing: -0.5,
  },
  headerIconWrapper: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },

  body: { padding: 16, paddingTop: 24, paddingBottom: 60 },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.2,
    color: '#6B7A90', textTransform: 'uppercase', marginBottom: 10,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: '#D6E4F5',
    flexDirection: 'row', alignItems: 'center', gap: 14,
    shadowColor: '#1A1A2E', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  iconTile: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(45,109,181,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 2 },
  cardSub:   { fontSize: 12, color: '#6B7A90' },
});
