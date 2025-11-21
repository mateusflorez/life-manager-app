import { useState, useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  useColorScheme,
} from 'react-native';
import { useFocus } from '@/contexts/focus-context';
import { useSettings } from '@/contexts/settings-context';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  t,
  formatDateTime,
  groupEntriesByMonth,
  FocusEntry,
} from '@/types/focus';

export default function FocusHistoryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { settings } = useSettings();
  const language = settings.language;

  const { entries, deleteEntry } = useFocus();
  const [searchQuery, setSearchQuery] = useState('');

  // Theme colors
  const cardBg = isDark ? '#1A1A1A' : '#F9F9F9';
  const borderColor = isDark ? '#333' : '#E0E0E0';
  const textPrimary = isDark ? '#ECEDEE' : '#11181C';
  const textSecondary = isDark ? '#999' : '#666';
  const accentColor = '#007AFF';

  // Filter and group entries
  const filteredGroups = useMemo(() => {
    let filtered = entries;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = entries.filter((entry) => {
        const dateStr = formatDateTime(entry.startedAt, language).toLowerCase();
        const modeStr = t(entry.mode, language).toLowerCase();
        const durationStr = `${entry.durationMinutes}`;
        return (
          dateStr.includes(query) ||
          modeStr.includes(query) ||
          durationStr.includes(query) ||
          (entry.tag && entry.tag.toLowerCase().includes(query))
        );
      });
    }

    return groupEntriesByMonth(filtered, language);
  }, [entries, searchQuery, language]);

  const handleDelete = (entry: FocusEntry) => {
    Alert.alert(
      t('delete', language),
      t('deleteConfirm', language),
      [
        { text: t('cancel', language), style: 'cancel' },
        {
          text: t('delete', language),
          style: 'destructive',
          onPress: () => deleteEntry(entry.id),
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#151718' : '#fff' }]}
      contentContainerStyle={styles.content}
    >
      {/* Search */}
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: cardBg, borderColor },
        ]}
      >
        <IconSymbol name="magnifyingglass" size={18} color={textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: textPrimary }]}
          placeholder={t('search', language)}
          placeholderTextColor={textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <IconSymbol name="xmark.circle.fill" size={18} color={textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Grouped Entries */}
      {filteredGroups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="clock" size={48} color={textSecondary} />
          <Text style={[styles.emptyText, { color: textSecondary }]}>
            {t('noHistory', language)}
          </Text>
        </View>
      ) : (
        filteredGroups.map((group) => (
          <View key={group.month} style={styles.monthGroup}>
            <Text style={[styles.monthTitle, { color: textPrimary }]}>
              {group.month}
            </Text>
            <View style={[styles.entriesCard, { backgroundColor: cardBg, borderColor }]}>
              {group.entries.map((entry, index) => (
                <View
                  key={entry.id}
                  style={[
                    styles.entryItem,
                    index < group.entries.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: borderColor,
                    },
                  ]}
                >
                  <View style={styles.entryIcon}>
                    <IconSymbol
                      name={entry.mode === 'pomodoro' ? 'clock.badge.checkmark' : entry.mode === 'countdown' ? 'timer' : 'stopwatch'}
                      size={16}
                      color={accentColor}
                    />
                  </View>
                  <View style={styles.entryContent}>
                    <View style={styles.entryHeader}>
                      <Text style={[styles.entryDuration, { color: textPrimary }]}>
                        {entry.durationMinutes} {t('min', language)}
                      </Text>
                      <Text style={[styles.entryMode, { color: textSecondary }]}>
                        {t(entry.mode, language)}
                      </Text>
                    </View>
                    <Text style={[styles.entryDate, { color: textSecondary }]}>
                      {formatDateTime(entry.startedAt, language)}
                    </Text>
                    {entry.tag && (
                      <View style={[styles.tag, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]}>
                        <Text style={[styles.tagText, { color: textPrimary }]}>
                          {entry.tag}
                        </Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(entry)}
                  >
                    <IconSymbol name="trash" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
  },
  monthGroup: {
    gap: 8,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  entriesCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  entryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,122,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryContent: {
    flex: 1,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryDuration: {
    fontSize: 16,
    fontWeight: '600',
  },
  entryMode: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  entryDate: {
    fontSize: 13,
    marginTop: 2,
  },
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  },
  tagText: {
    fontSize: 11,
  },
  deleteButton: {
    padding: 8,
  },
});
