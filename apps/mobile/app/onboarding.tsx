import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

// Mandatory plate registration gate — shown after login if user has no plate registered.
// User cannot navigate past this screen until they register at least one plate.
export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register Your Plate</Text>
      <Text style={styles.body}>
        Before you can look up other vehicles, you must register your own licence plate.
      </Text>
      {/* PlateInput + submit will be added in Session 3 */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
    padding: 32,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.dark,
    marginBottom: 16,
  },
  body: {
    fontSize: 16,
    color: theme.colors.dark,
    lineHeight: 24,
  },
});
