import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView, Platform, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { PlateDisplay } from '../../components/PlateDisplay';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { isValidPlate, normalizePlate, formatPlate } from '../../utils/plateParser';
import { ADMIN_EMAILS } from '../../constants/config';

export default function ProfileScreen() {
  const { authState, signOut, setHasPlate } = useAuth();
  const router = useRouter();
  const user = authState.status === 'authenticated' ? authState.user : null;
  const isAdmin = ADMIN_EMAILS.includes((user?.email ?? '').toLowerCase());

  const [currentPlate, setCurrentPlate] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [plateError, setPlateError] = useState('');
  useEffect(() => {
    api.getMyPlates().then((plates) => {
      const active = plates.find((p) => p.isActive);
      if (active) setCurrentPlate(active.plateNumber);
    }).catch(() => {});
  }, []);

  async function handleSavePlate() {
    if (!isValidPlate(newPlate)) {
      setPlateError('Please enter a valid plate.');
      return;
    }
    setSaving(true);
    setPlateError('');
    try {
      const saved = await api.registerPlate(normalizePlate(newPlate));
      setCurrentPlate(saved.plateNumber);
      setHasPlate(true);
      setEditing(false);
      setNewPlate('');
    } catch (err: any) {
      setPlateError(err.message ?? 'Failed to save plate.');
    } finally {
      setSaving(false);
    }
  }

  function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }

  // Deterministic avatar hue from display name
  const displayName = user?.displayName ?? '';
  const charCodeSum = displayName.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const hue = (charCodeSum * 37) % 360;
  const avatarColor = `hsl(${hue}, 45%, 55%)`;

  const nameParts = displayName.trim().split(/\s+/);
  const initials = nameParts
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F8FC' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Gradient header */}
        <LinearGradient
          colors={['#2D6DB5', '#5BA4E6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            height: 150,
            paddingTop: 54,
            paddingBottom: 18,
            paddingHorizontal: 20,
            justifyContent: 'flex-end',
          }}
        >
          {/* Decorative circles */}
          <View
            style={{
              position: 'absolute',
              top: -30,
              right: -30,
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: 'rgba(255,255,255,0.07)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 20,
              right: 60,
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: 'rgba(255,255,255,0.05)',
            }}
          />

          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: 'rgba(255,255,255,0.75)',
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            ACCOUNT
          </Text>
          <Text
            style={{
              fontSize: 30,
              fontWeight: '700',
              color: '#FFFFFF',
              letterSpacing: -0.5,
            }}
          >
            My Profile
          </Text>
        </LinearGradient>

        {/* Body content */}
        <View style={{ paddingHorizontal: 16, marginTop: -50 }}>

          {/* 1. Identity card */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 22,
              padding: 22,
              shadowColor: 'rgba(30,50,90,1)',
              shadowOpacity: 0.08,
              shadowRadius: 28,
              shadowOffset: { width: 0, height: 10 },
              elevation: 6,
              borderWidth: 1,
              borderColor: '#D6E4F5',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            {/* Avatar */}
            <View
              style={{
                width: 78,
                height: 78,
                borderRadius: 39,
                backgroundColor: avatarColor,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 31, fontWeight: '700', color: '#FFFFFF' }}>
                {initials || '?'}
              </Text>
            </View>

            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: '#1A1A2E',
                marginTop: 12,
                letterSpacing: -0.3,
              }}
            >
              {displayName}
            </Text>
            <Text style={{ fontSize: 13, color: '#6B7A90', marginTop: 3 }}>
              {user?.email}
            </Text>

            {/* Status chip */}
            <View
              style={{
                marginTop: 10,
                paddingVertical: 4,
                paddingHorizontal: 10,
                borderRadius: 6,
                backgroundColor: 'rgba(40,167,69,0.09)',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#28A745',
                }}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: '#28A745',
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                }}
              >
                ACTIVE EMPLOYEE
              </Text>
            </View>
          </View>

          {/* 2. Plate card */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 22,
              padding: 20,
              borderWidth: 1,
              borderColor: '#D6E4F5',
              shadowColor: '#000',
              shadowOpacity: 0.03,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
              marginBottom: 16,
            }}
          >
            {/* Header row */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  letterSpacing: 1.2,
                  color: '#6B7A90',
                  textTransform: 'uppercase',
                }}
              >
                MY LICENCE PLATE
              </Text>
              {!editing && (
                <TouchableOpacity
                  onPress={() => setEditing(true)}
                  style={{
                    backgroundColor: 'rgba(45,109,181,0.08)',
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="pencil" size={13} color="#2D6DB5" />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#2D6DB5' }}>
                    Change
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {!editing ? (
              <View style={{ alignItems: 'center', paddingVertical: 4, paddingBottom: 6 }}>
                <PlateDisplay plate={currentPlate || ''} size="lg" />
              </View>
            ) : (
              <View>
                {/* Gradient-border input wrapper */}
                <View
                  style={{
                    borderRadius: 12,
                    padding: 2,
                    backgroundColor: '#2D6DB5',
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 10,
                    }}
                  >
                    <TextInput
                      style={{
                        padding: 14,
                        paddingHorizontal: 16,
                        fontSize: 22,
                        fontWeight: '700',
                        letterSpacing: 3,
                        fontFamily: Platform.select({ ios: 'Courier New', android: 'monospace' }),
                        color: '#1A1A2E',
                      }}
                      value={newPlate}
                      onChangeText={(text) => {
                        setNewPlate(text);
                        setPlateError('');
                      }}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      placeholder="ABC 1234"
                      placeholderTextColor="#9AA5B8"
                    />
                  </View>
                </View>

                {/* Cancel / Save row */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      height: 46,
                      borderRadius: 12,
                      backgroundColor: '#FFFFFF',
                      borderWidth: 1.5,
                      borderColor: '#D6E4F5',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onPress={() => { setEditing(false); setNewPlate(''); setPlateError(''); }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1A2E' }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      flex: 1,
                      height: 46,
                      borderRadius: 12,
                      backgroundColor: '#2D6DB5',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: (!isValidPlate(newPlate) || saving) ? 0.45 : 1,
                    }}
                    onPress={handleSavePlate}
                    disabled={!isValidPlate(newPlate) || saving}
                    activeOpacity={0.7}
                  >
                    {saving
                      ? <ActivityIndicator color="#FFFFFF" size="small" />
                      : <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFFFFF' }}>Save</Text>
                    }
                  </TouchableOpacity>
                </View>

                {plateError ? (
                  <Text style={{ fontSize: 13, color: '#D9534F', marginTop: 6 }}>
                    {plateError}
                  </Text>
                ) : null}
              </View>
            )}
          </View>

          {/* 3. Admin panel row — only visible to admins */}
          {isAdmin && (
            <TouchableOpacity
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderWidth: 1.5,
                borderColor: '#2D6DB5',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                marginBottom: 12,
              }}
              onPress={() => router.push('/(auth)/admin')}
              activeOpacity={0.7}
            >
              <View style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: 'rgba(45,109,181,0.08)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="shield-checkmark" size={18} color="#2D6DB5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#2D6DB5' }}>
                  Admin Panel
                </Text>
                <Text style={{ fontSize: 12, color: '#6B7A90', marginTop: 2 }}>
                  BambooHR sync &amp; system tools
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9AA5B8" />
            </TouchableOpacity>
          )}

          {/* 4. Sign out card */}
          <TouchableOpacity
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderWidth: 1.5,
              borderColor: 'rgba(217,83,79,0.33)',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: 'rgba(217,83,79,0.08)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="log-out-outline" size={18} color="#D9534F" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#D9534F' }}>
                Sign out
              </Text>
              <Text style={{ fontSize: 12, color: '#6B7A90', marginTop: 2 }}>
                You'll need to sign in again
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#9AA5B8" />
          </TouchableOpacity>

          {/* 5. Footer */}
          <View style={{ marginTop: 22, marginBottom: 16 }}>
            <Text
              style={{
                textAlign: 'center',
                fontSize: 11,
                color: '#9AA5B8',
                letterSpacing: 0.3,
              }}
            >
              Foothill Park · v1.0 · Internal build
            </Text>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}
