import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Linking, TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { api } from '../../services/api';

interface Employee {
  id: string;
  displayName: string;
  department: string | null;
  phone: string | null;
}

export default function EmployeesScreen() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getEmployees()
      .then(setEmployees)
      .catch(() => setError('Could not load employees.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = employees.filter((e) =>
    e.displayName.toLowerCase().includes(search.toLowerCase()) ||
    (e.department ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={theme.colors.border} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or department..."
          placeholderTextColor={theme.colors.border}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <Text style={styles.empty}>No employees found.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarChar}>{item.displayName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.empName}>{item.displayName}</Text>
              {item.department && <Text style={styles.empDept}>{item.department}</Text>}
            </View>
            {item.phone ? (
              <TouchableOpacity
                style={styles.callChip}
                onPress={() => Linking.openURL(`tel:${item.phone}`)}
              >
                <Text style={styles.callChipText}>📞 Call</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.noPhone}>No phone</Text>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.white },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: theme.colors.error, fontSize: 15 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    margin: 16, padding: 12, backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md, borderWidth: 1.5, borderColor: theme.colors.border,
  },
  searchInput: { flex: 1, fontSize: 15, color: theme.colors.dark },

  list: { paddingHorizontal: 16, paddingBottom: 100 },
  separator: { height: 1, backgroundColor: theme.colors.border },

  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12,
  },
  avatarSmall: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarChar: { fontSize: 18, fontWeight: '700', color: theme.colors.white },
  info: { flex: 1 },
  empName: { fontSize: 16, fontWeight: '600', color: theme.colors.dark },
  empDept: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  callChip: {
    backgroundColor: theme.colors.primary, paddingVertical: 6,
    paddingHorizontal: 12, borderRadius: theme.radius.full,
  },
  callChipText: { color: theme.colors.white, fontSize: 13, fontWeight: '600' },
  noPhone: { fontSize: 12, color: theme.colors.dark, opacity: 0.35 },
  empty: { textAlign: 'center', marginTop: 40, color: theme.colors.dark, opacity: 0.4 },
});
