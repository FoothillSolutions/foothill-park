import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, TextInput, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useFocusEffect, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { theme } from '../../constants/theme';
import { EmployeeCardSkeleton } from '../../components/Skeleton';

interface Employee {
  id: string;
  displayName: string;
  department: string | null;
  phone: string | null;
  discordId: string | null;
  discordUsername: string | null;
  plateNumber: string | null;
}

function getAvatarColor(name: string): string {
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) * 37 % 360;
  return `hsl(${hue},45%,55%)`;
}

function getAvatarInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  const letters = words.slice(0, 2).map((w) => w.charAt(0).toUpperCase());
  return letters.join('');
}

export default function EmployeesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: employees = [], isLoading, error } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: () => api.getEmployees(),
  });

  // Refetch when tab comes into focus
  useFocusEffect(useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['employees'] });
  }, [queryClient]));

  const filtered = employees.filter((e) =>
    e.displayName.toLowerCase().includes(search.toLowerCase()) ||
    (e.department ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerEyebrow}>LOADING</Text>
              <Text style={styles.headerTitle}>People</Text>
            </View>
            <View style={styles.headerIconWrapper}>
              <Ionicons name="people" size={20} color={theme.colors.white} />
            </View>
          </View>
        </LinearGradient>
        <View style={styles.list}>
          {Array.from({ length: 6 }).map((_, i) => (
            <EmployeeCardSkeleton key={i} />
          ))}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error.message || 'Could not load employees.'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Gradient header */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Decorative circles */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        {/* Header row */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerEyebrow}>
              {employees.length} TEAMMATES
            </Text>
            <Text style={styles.headerTitle}>People</Text>
          </View>
          <View style={styles.headerIconWrapper}>
            <Ionicons name="people" size={20} color={theme.colors.white} />
          </View>
        </View>
      </LinearGradient>

      {/* Sticky search bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={theme.colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or department…"
            placeholderTextColor={theme.colors.textTertiary}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            clearButtonMode={Platform.OS === 'ios' ? 'while-editing' : 'never'}
          />
          {Platform.OS !== 'ios' && search.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearch('')}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={12} color={theme.colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No matches</Text>
            <Text style={styles.emptySubtitle}>Try a different name or team</Text>
          </View>
        }
        renderItem={({ item }) => {
          const avatarBg = getAvatarColor(item.displayName);
          const initials = getAvatarInitials(item.displayName);
          return (
            <View style={styles.card}>
              {/* Avatar */}
              <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>

              {/* Info column */}
              <View style={styles.info}>
                <Text style={styles.empName} numberOfLines={1}>
                  {item.displayName}
                </Text>
                <View style={styles.metaRow}>
                  {item.department ? (
                    <View style={styles.deptChip}>
                      <Text style={styles.deptChipText}>{item.department}</Text>
                    </View>
                  ) : null}
                  {item.plateNumber ? (
                    <View style={styles.plateChip}>
                      <Ionicons name="car" size={9} color={theme.colors.textSecondary} />
                      <Text style={styles.plateChipText}>{item.plateNumber}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Actions column */}
              <View style={styles.actions}>
                {item.discordUsername ? (
                  <TouchableOpacity
                    style={styles.discordButton}
                    onPress={() =>
                      Alert.alert(
                        'Send Discord Message',
                        `Notify ${item.displayName} that their car is blocking you?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Send',
                            onPress: () =>
                              api.sendDiscordDm(item.discordUsername!, item.displayName)
                                .then(() =>
                                  Alert.alert('Message Sent', `${item.displayName} has been notified on Discord.`)
                                )
                                .catch((err: any) =>
                                  Alert.alert('Failed', err.message ?? 'Could not send Discord message.')
                                ),
                          },
                        ]
                      )
                    }
                    activeOpacity={0.75}
                  >
                    <FontAwesome5 name="discord" size={12} color={theme.colors.white} />
                    <Text style={styles.discordButtonText} numberOfLines={1}>
                      Message
                    </Text>
                  </TouchableOpacity>
                ) : null}
                {!item.plateNumber ? (
                  <TouchableOpacity
                    style={styles.addPlateButton}
                    onPress={() =>
                      router.push({
                        pathname: '/(auth)/register-plate',
                        params: { employeeId: item.id, employeeName: item.displayName },
                      })
                    }
                    activeOpacity={0.75}
                  >
                    <Ionicons name="add-circle" size={12} color={theme.colors.white} />
                    <Text style={styles.addPlateButtonText} numberOfLines={1}>
                      Add Plate
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
  },
  errorText: {
    fontSize: 15,
    color: theme.colors.error,
  },

  // Header
  header: {
    height: 140,
    paddingTop: 54,
    paddingBottom: 18,
    paddingHorizontal: 20,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  decorCircle2: {
    position: 'absolute',
    right: 40,
    bottom: -80,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerEyebrow: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: theme.colors.white,
    letterSpacing: -0.5,
  },
  headerIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search bar
  searchWrapper: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.textPrimary,
    paddingVertical: 0,
  },
  clearButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // List
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.dark,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },

  // Avatar
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 19,
    fontWeight: '700',
    color: theme.colors.white,
  },

  // Info
  info: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  empName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  deptChip: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(45,109,181,0.08)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  deptChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  plateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(107,122,144,0.1)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  plateChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
  },

  // Actions
  actions: {
    alignItems: 'flex-end',
    gap: 5,
    flexShrink: 0,
  },
  callButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  callButtonText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  discordButton: {
    backgroundColor: theme.colors.discord,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  discordButtonText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: '700',
    maxWidth: 60,
  },
  addPlateButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addPlateButtonText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: '700',
    maxWidth: 60,
  },
  noPhone: {
    fontSize: 10,
    color: theme.colors.textTertiary,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textTertiary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: theme.colors.textTertiary,
  },
});
