import { View, TextInput, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';
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

  return (
    <View>
      <View style={[styles.inputWrapper, error ? styles.inputError : showValid ? styles.inputValid : null]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleChange}
          placeholder="e.g. 12-345-67"
          placeholderTextColor={theme.colors.border}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={12}
          keyboardType="default"
        />
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : showValid ? (
        <Text style={styles.hintText}>Looks good: {formatPlate(value)}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrapper: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  inputValid: {
    borderColor: theme.colors.success,
  },
  input: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.dark,
    letterSpacing: 3,
  },
  errorText: {
    marginTop: 6,
    fontSize: 13,
    color: theme.colors.error,
  },
  hintText: {
    marginTop: 6,
    fontSize: 13,
    color: theme.colors.success,
  },
});
