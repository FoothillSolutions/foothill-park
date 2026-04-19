import { Tabs } from 'expo-router';
import { View, TouchableOpacity, Text, StyleSheet, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { GATE_PHONE, GATE_LABEL } from '../../constants/config';

async function callGate() {
  const url = `tel:${GATE_PHONE}`;
  const supported = await Linking.canOpenURL(url);
  if (!supported) {
    Alert.alert('Cannot Place Call', 'Phone calls are not supported on this device.');
    return;
  }
  Linking.openURL(url);
}

function GateButton() {
  return (
    <TouchableOpacity style={styles.gate} onPress={callGate} activeOpacity={0.8}>
      <Ionicons name="call" size={16} color={theme.colors.white} />
      <Text style={styles.gateLabel}>{GATE_LABEL}</Text>
    </TouchableOpacity>
  );
}

export default function AuthLayout() {
  return (
    <View style={styles.flex}>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: theme.colors.white,
          headerTitleStyle: { fontWeight: '600' },
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.dark,
          tabBarStyle: { borderTopColor: theme.colors.border },
        }}
      >
        <Tabs.Screen
          name="scan"
          options={{
            title: 'Scan Plate',
            tabBarLabel: 'Scan',
            tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="employees"
          options={{
            title: 'Employees',
            tabBarLabel: 'People',
            tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'My Profile',
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} />,
          }}
        />
      </Tabs>
      <GateButton />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gate: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    paddingVertical: 10,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
  },
  gateLabel: { color: theme.colors.white, fontWeight: '700', fontSize: 13, letterSpacing: 0.3 },
});
