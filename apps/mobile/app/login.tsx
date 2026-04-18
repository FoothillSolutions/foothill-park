import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { theme } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const { authState, signIn, request } = useAuth();

  const isLoading = authState.status === 'loading' || !request;

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
      </View>
      <Text style={styles.title}>Foothill Park</Text>
      <Text style={styles.subtitle}>Internal Parking Resolution</Text>

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={signIn}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={theme.colors.white} />
        ) : (
          <Text style={styles.buttonText}>Sign in with Microsoft</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.footer}>Foothill Technology Solutions</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  logoContainer: {
    width: 220,
    height: 100,
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 220,
    height: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.dark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.primary,
    marginBottom: 48,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    height: 54,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    color: theme.colors.dark,
    fontSize: 13,
    opacity: 0.5,
  },
});
