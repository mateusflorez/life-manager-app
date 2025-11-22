import { useState, useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { RippleBackground } from '@/components/ui/ripple-background';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFocus } from '@/contexts/focus-context';
import { useSettings } from '@/contexts/settings-context';
import {
  t,
  formatDateTime,
  groupEntriesByMonth,
  FocusEntry,
} from '@/types/focus';
import { useAlert } from '@/contexts/alert-context';

export default function FocusHistoryScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { settings } = useSettings();
  const language = settings.language;
  const { showConfirm } = useAlert();

  const { entries, deleteEntry } = useFocus();
  const [searchQuery, setSearchQuery] = useState('');

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
    showConfirm({
      title: t('delete', language),
      message: t('deleteConfirm', language),
      buttons: [
        { text: t('cancel', language), style: 'cancel' },
        {
          text: t('delete', language),
          style: 'destructive',
          onPress: () => deleteEntry(entry.id),
        },
      ],
    });
  };

  return (
    <ThemedView style={styles.container}>
      <RippleBackground isDark={isDark} rippleCount={6} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Search */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            },
          ]}
        >
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.searchIcon}
          >
            <IconSymbol name="magnifyingglass" size={14} color="#FFFFFF" />
          </LinearGradient>
          <TextInput
            style={[styles.searchInput, { color: isDark ? '#FFFFFF' : '#111827' }]}
            placeholder={t('search', language)}
            placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconSymbol name="xmark.circle.fill" size={20} color={isDark ? '#666' : '#9CA3AF'} />
            </TouchableOpacity>
          )}
        </View>

        {/* Grouped Entries */}
        {filteredGroups.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              },
            ]}
          >
            <LinearGradient
              colors={['#6366F1', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyIcon}
            >
              <IconSymbol name="clock" size={32} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.emptyText, { color: isDark ? '#808080' : '#6B7280' }]}>
              {t('noHistory', language)}
            </Text>
          </View>
        ) : (
          filteredGroups.map((group) => (
            <View key={group.month} style={styles.monthGroup}>
              <View style={styles.monthHeader}>
                <LinearGradient
                  colors={['#6366F1', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.monthIcon}
                >
                  <IconSymbol name="calendar" size={12} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.monthTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {group.month}
                </Text>
                <View style={[styles.monthBadge, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                  <Text style={styles.monthBadgeText}>{group.entries.length}</Text>
                </View>
              </View>

              <View
                style={[
                  styles.entriesCard,
                  {
                    backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  },
                ]}
              >
                {group.entries.map((entry, index) => (
                  <View
                    key={entry.id}
                    style={[
                      styles.entryItem,
                      index < group.entries.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={['#6366F1', '#8B5CF6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.entryIcon}
                    >
                      <IconSymbol
                        name={entry.mode === 'pomodoro' ? 'clock.badge.checkmark' : entry.mode === 'countdown' ? 'timer' : 'stopwatch'}
                        size={14}
                        color="#FFFFFF"
                      />
                    </LinearGradient>
                    <View style={styles.entryContent}>
                      <View style={styles.entryHeader}>
                        <Text style={[styles.entryDuration, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                          {entry.durationMinutes} {t('min', language)}
                        </Text>
                        <View style={[styles.modeTag, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                          <Text style={styles.modeTagText}>{t(entry.mode, language)}</Text>
                        </View>
                      </View>
                      <Text style={[styles.entryDate, { color: isDark ? '#808080' : '#6B7280' }]}>
                        {formatDateTime(entry.startedAt, language)}
                      </Text>
                      {entry.tag && (
                        <View style={[styles.tag, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}>
                          <IconSymbol name="tag" size={10} color={isDark ? '#808080' : '#6B7280'} />
                          <Text style={[styles.tagText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                            {entry.tag}
                          </Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(entry)}
                      activeOpacity={0.7}
                    >
                      <LinearGradient
                        colors={['#EF4444', '#DC2626']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.deleteButtonGradient}
                      >
                        <IconSymbol name="trash" size={14} color="#FFFFFF" />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
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
    padding: 20,
    paddingBottom: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  emptyCard: {
    padding: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  monthGroup: {
    marginBottom: 20,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    marginLeft: 4,
  },
  monthIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  monthBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  monthBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
  },
  entriesCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  entryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  entryIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  entryContent: {
    flex: 1,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  entryDuration: {
    fontSize: 17,
    fontWeight: '600',
  },
  modeTag: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  modeTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366F1',
    textTransform: 'capitalize',
  },
  entryDate: {
    fontSize: 13,
    marginTop: 4,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  deleteButtonGradient: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
