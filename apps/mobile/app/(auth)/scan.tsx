import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

export default function ScanScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Camera + OCR — Session 6</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: { color: theme.colors.white, fontSize: 16 },
});
