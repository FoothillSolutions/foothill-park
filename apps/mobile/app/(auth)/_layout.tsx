import { Tabs } from 'expo-router';
import { View, TouchableOpacity, Text, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GATE_PHONE, GATE_LABEL } from '../../constants/config';

function callGate() {
  Linking.openURL(`tel:${GATE_PHONE}`);
}

function GateButton() {
  return (
    <TouchableOpacity style={styles.gate} onPress={callGate} activeOpacity={0.8}>
      <Ionicons name="call" size={15} color="#FFFFFF" />
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
          tabBarActiveTintColor: '#2D6DB5',
          tabBarInactiveTintColor: '#9AA5B8',
          tabBarStyle: {
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderTopColor: '#D6E4F5',
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
    backgroundColor: '#2D6DB5',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1.5,
    borderColor: '#5BA4E6',
    shadowColor: '#2D6DB5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  gateLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.3,
  },
});
