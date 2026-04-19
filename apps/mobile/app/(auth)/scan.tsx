import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Linking, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { theme } from '../../constants/theme';
import { PlateInput } from '../../components/PlateInput';
import { api } from '../../services/api';
import { isValidPlate, normalizePlate, formatPlate } from '../../utils/plateParser';

type Result =
  | { found: false }
  | { found: true; owner: { displayName: string; phone: string | null; discordId: string | null; department: string | null } };

export default function ScanScreen() {
  const [plate, setPlate] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');

  async function handleLookup() {
    if (!isValidPlate(plate)) return;
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const data = await api.lookupPlate(normalizePlate(plate));
      setResult(data as Result);
    } catch (err: any) {
      setError(err.message ?? 'Lookup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setPlate('');
    setResult(null);
    setError('');
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Entry section */}
        {!result && (
          <>
            <Text style={styles.heading}>Which car is blocking you?</Text>
            <Text style={styles.sub}>Enter the licence plate number to find the owner.</Text>

            <View style={styles.inputRow}>
              <PlateInput value={plate} onChange={setPlate} error={error} />
            </View>

            <TouchableOpacity
              style={[styles.button, (!isValidPlate(plate) || loading) && styles.buttonDisabled]}
              onPress={handleLookup}
              disabled={!isValidPlate(plate) || loading}
            >
              {loading
                ? <ActivityIndicator color={theme.colors.white} />
                : <Text style={styles.buttonText}>Look Up Owner</Text>}
            </TouchableOpacity>

            <Text style={styles.hint}>Camera scanning coming soon — enter manually for now.</Text>
          </>
        )}

        {/* Result section */}
        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.plateDisplay}>{formatPlate(normalizePlate(plate))}</Text>

            {result.found ? (
              <>
                <Text style={styles.ownerName}>{result.owner.displayName}</Text>
                {result.owner.department && (
                  <Text style={styles.ownerDept}>{result.owner.department}</Text>
                )}

                {result.owner.phone ? (
                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={() => Linking.openURL(`tel:${result.owner.phone}`)}
                  >
                    <Text style={styles.callIcon}>📞</Text>
                    <Text style={styles.callText}>Call {result.owner.displayName.split(' ')[0]}</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.noPhone}>
                    <Text style={styles.noPhoneText}>No phone number on file</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.notFound}>
                <Text style={styles.notFoundIcon}>🚫</Text>
                <Text style={styles.notFoundText}>No employee found for this plate.</Text>
                <Text style={styles.notFoundSub}>The car may belong to a visitor.</Text>
              </View>
            )}

            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetText}>Search Another Plate</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.white },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  heading: {
    fontSize: 22, fontWeight: '700', color: theme.colors.dark, marginBottom: 8,
  },
  sub: { fontSize: 15, color: theme.colors.textSecondary, marginBottom: 24, lineHeight: 22 },
  inputRow: { marginBottom: 16 },
  button: {
    backgroundColor: theme.colors.primary, paddingVertical: 16,
    borderRadius: theme.radius.md, alignItems: 'center', height: 54, justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: theme.colors.white, fontSize: 16, fontWeight: '600' },
  hint: { marginTop: 16, fontSize: 13, color: theme.colors.dark, opacity: 0.4, textAlign: 'center' },

  // Result card
  resultCard: {
    backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg,
    padding: 28, alignItems: 'center', gap: 8,
  },
  plateDisplay: {
    fontSize: 32, fontWeight: '800', color: theme.colors.dark,
    letterSpacing: 4, marginBottom: 8,
  },
  ownerName: { fontSize: 24, fontWeight: '700', color: theme.colors.dark },
  ownerDept: { fontSize: 15, color: theme.colors.textSecondary, marginBottom: 8 },
  callButton: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: theme.colors.primary, paddingVertical: 16, paddingHorizontal: 32,
    borderRadius: theme.radius.md, marginTop: 16, width: '100%', justifyContent: 'center',
  },
  callIcon: { fontSize: 20 },
  callText: { color: theme.colors.white, fontSize: 17, fontWeight: '700' },
  noPhone: {
    backgroundColor: theme.colors.border, borderRadius: theme.radius.md,
    padding: 14, marginTop: 12, width: '100%', alignItems: 'center',
  },
  noPhoneText: { color: theme.colors.dark, opacity: 0.6 },
  notFound: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  notFoundIcon: { fontSize: 40 },
  notFoundText: { fontSize: 17, fontWeight: '600', color: theme.colors.dark },
  notFoundSub: { fontSize: 14, color: theme.colors.textSecondary },
  resetButton: { marginTop: 24, paddingVertical: 12 },
  resetText: { color: theme.colors.primary, fontSize: 15, fontWeight: '600' },
});
