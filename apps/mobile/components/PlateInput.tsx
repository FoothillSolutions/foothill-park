import { View, TextInput, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatPlate, isValidPlate } from '../utils/plateParser';

interface Props {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function PlateInput({ value, onChange, error }: Props) {
  function handleChange(text: string) {
    // Strip everything except digits, letters, spaces and dashes
    const cleaned = text.replace(/[^A-Za-z0-9\s\-]/g, '').toUpperCase();
    onChange(cleaned);
  }

  const showValid = value.length > 0 && isValidPlate(value);

  const borderBg = error ? '#D9534F' : showValid ? '#2D6DB5' : '#D6E4F5';

  return (
    <View>
      <View style={[styles.borderWrapper, { backgroundColor: borderBg }]}>
        <View style={styles.innerWrapper}>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={handleChange}
            placeholder="e.g. 7-0339-96"
            placeholderTextColor="#9AA5B8"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={12}
            keyboardType="default"
          />
          {showValid && (
            <View style={styles.checkBadge}>
              <Ionicons name="checkmark" size={15} color="#FFFFFF" />
            </View>
          )}
        </View>
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : showValid ? (
        <Text style={styles.validText}>Looks good — ready to register</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  borderWrapper: {
    borderRadius: 14,
    padding: 2,
  },
  innerWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingLeft: 16,
    paddingRight: 48,
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: 3,
    fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }),
  },
  checkBadge: {
    position: 'absolute',
    right: 14,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#28A745',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
    color: '#D9534F',
  },
  validText: {
    marginTop: 8,
    fontSize: 13,
    color: '#28A745',
  },
});
