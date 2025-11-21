import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { useMood } from '@/contexts/mood-context';
import { useSettings } from '@/contexts/settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatDate, getMoodFace } from '@/types/mood';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function MoodHistoryScreen() {
  const { loading, getGroupedEntries, deleteEntry } = useMood();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');

  const translations = {
    en: {
      searchPlaceholder: 'Search notes...',
      noHistory: 'No mood entries recorded yet.',
      noResults: 'No entries match your search.',
      delete: 'Delete',
      deleteConfirm: 'Are you sure you want to delete this entry?',
      cancel: 'Cancel',
    },
    pt: {
      searchPlaceholder: 'Buscar notas...',
      noHistory: 'Nenhum registro de humor ainda.',
      noResults: 'Nenhum registro corresponde à busca.',
      delete: 'Excluir',
      deleteConfirm: 'Tem certeza que deseja excluir este registro?',
      cancel: 'Cancelar',
    },
  };

  const t = translations[settings.language];
  const groupedEntries = getGroupedEntries(settings.language);

  // Filter entries by search query
  const filteredGroups = groupedEntries
    .map((group) => ({
      ...group,
      entries: group.entries.filter((entry) =>
        searchQuery.trim() === ''
          ? true
          : entry.note?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((group) => group.entries.length > 0);

  const handleDelete = (entryId: string) => {
    Alert.alert('', t.deleteConfirm, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: () => deleteEntry(entryId),
      },
    ]);
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FACC15" />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Search Bar */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5',
              borderColor: isDark ? '#333' : '#E0E0E0',
            },
          ]}
        >
          <IconSymbol name="magnifyingglass" size={18} color={isDark ? '#666' : '#999'} />
          <TextInput
            style={[styles.searchInput, { color: isDark ? '#ECEDEE' : '#11181C' }]}
            placeholder={t.searchPlaceholder}
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconSymbol name="xmark.circle.fill" size={18} color={isDark ? '#666' : '#999'} />
            </TouchableOpacity>
          )}
        </View>

        {filteredGroups.length === 0 ? (
          <Text style={[styles.emptyText, { color: isDark ? '#666' : '#999' }]}>
            {searchQuery.trim() ? t.noResults : t.noHistory}
          </Text>
        ) : (
          filteredGroups.map((group) => (
            <View key={group.month} style={styles.monthSection}>
              <Text style={[styles.monthTitle, { color: isDark ? '#999' : '#666' }]}>
                {group.month}
              </Text>
              {group.entries.map((entry) => (
                <View
                  key={entry.id}
                  style={[
                    styles.entryCard,
                    {
                      backgroundColor: isDark ? '#1A1A1A' : '#F9F9F9',
                      borderColor: isDark ? '#333' : '#E0E0E0',
                    },
                  ]}
                >
                  <View style={styles.entryHeader}>
                    <Text style={[styles.entryDate, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                      {formatDate(entry.date, settings.language)}
                    </Text>
                    <View style={styles.entryRight}>
                      <Text style={styles.entryMood}>
                        {getMoodFace(entry.mood)} {entry.mood}/5
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleDelete(entry.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <IconSymbol name="trash" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {entry.note && (
                    <Text style={[styles.entryNote, { color: isDark ? '#999' : '#666' }]}>
                      {entry.note}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  monthSection: {
    gap: 10,
  },
  monthTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  entryCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  entryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  entryMood: {
    fontSize: 14,
    fontWeight: '600',
  },
  entryNote: {
    fontSize: 14,
    lineHeight: 20,
  },
});
