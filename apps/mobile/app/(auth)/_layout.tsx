import { Tabs } from 'expo-router';
import { View, TouchableOpacity, Text, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GATE_PHONE, GATE_LABEL } from '../../constants/config';
import { theme } from '../../constants/theme';

function callGate() {
  Linking.openURL(`tel:${GATE_PHONE}`);
}

function GateButton() {
  return (
    <TouchableOpacity style={styles.gate} onPress={callGate} activeOpacity={0.8}>
      <Ionicons name="call" size={15} color={theme.colors.white} />
      <Text style={styles.gateLabel}>{GATE_LABEL}</Text>
    </TouchableOpacity>
  );
}

export default function AuthLayout() {
  return (
    <View style={styles.flex}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textTertiary,
          tabBarStyle: {
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderTopColor: theme.colors.border,
            borderTopWidth: 1,
            paddingBottom: 28,
            paddingTop: 8,
            height: 88,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
          },
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
        <Tabs.Screen
          name="admin"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="register-plate"
          options={{ href: null }}
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
    bottom: 104,
    right: 16,
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  gateLabel: {
    color: theme.colors.white,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.3,
  },
});
