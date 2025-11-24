import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { RippleBackground } from '@/components/ui/ripple-background';
import { useMood } from '@/contexts/mood-context';
import { useSettings } from '@/contexts/settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { formatDate, getMoodFace, MOOD_FACES } from '@/types/mood';
import type { MoodEntry, MoodScore } from '@/types/mood';
import { useAlert } from '@/contexts/alert-context';

export default function MoodHistoryScreen() {
  const { loading, getGroupedEntries, deleteEntry, updateEntry } = useMood();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { showConfirm, showToast } = useAlert();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingEntry, setEditingEntry] = useState<MoodEntry | null>(null);
  const [editMood, setEditMood] = useState<number>(3);
  const [editNote, setEditNote] = useState('');
  const [saving, setSaving] = useState(false);

  const translations = {
    en: {
      searchPlaceholder: 'Search notes...',
      noHistory: 'No mood entries recorded yet',
      noHistoryDesc: 'Start logging your daily mood!',
      noResults: 'No entries match your search',
      delete: 'Delete',
      deleteConfirm: 'Are you sure you want to delete this entry?',
      cancel: 'Cancel',
      editEntry: 'Edit Entry',
      moodScore: 'Mood score',
      noteLabel: 'Note (optional)',
      notePlaceholder: 'How was your day?',
      save: 'Save',
      saving: 'Saving...',
      editSuccess: 'Entry updated successfully',
    },
    pt: {
      searchPlaceholder: 'Buscar notas...',
      noHistory: 'Nenhum registro de humor ainda',
      noHistoryDesc: 'Comece a registrar seu humor diário!',
      noResults: 'Nenhum registro corresponde à busca',
      delete: 'Excluir',
      deleteConfirm: 'Tem certeza que deseja excluir este registro?',
      cancel: 'Cancelar',
      editEntry: 'Editar Registro',
      moodScore: 'Nota do humor',
      noteLabel: 'Nota (opcional)',
      notePlaceholder: 'Como foi seu dia?',
      save: 'Salvar',
      saving: 'Salvando...',
      editSuccess: 'Registro atualizado com sucesso',
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
    showConfirm({
      title: '',
      message: t.deleteConfirm,
      buttons: [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete,
          style: 'destructive',
          onPress: () => deleteEntry(entryId),
        },
      ],
    });
  };

  const handleEdit = (entry: MoodEntry) => {
    setEditingEntry(entry);
    setEditMood(entry.mood);
    setEditNote(entry.note || '');
  };

  const handleCloseEdit = () => {
    setEditingEntry(null);
    setEditMood(3);
    setEditNote('');
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    setSaving(true);
    try {
      await updateEntry(editingEntry.id, Math.round(editMood) as MoodScore, editNote);
      showToast({ message: t.editSuccess, type: 'success' });
      handleCloseEdit();
    } catch (error) {
      console.error('Error updating mood entry:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <RippleBackground isDark={isDark} rippleCount={6} />
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={['#FACC15', '#F59E0B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loadingGradient}
          >
            <ActivityIndicator size="large" color="#000000" />
          </LinearGradient>
        </View>
      </ThemedView>
    );
  }

  const isEmpty = groupedEntries.length === 0;
  const noResults = !isEmpty && filteredGroups.length === 0;

  return (
    <ThemedView style={styles.container}>
      <RippleBackground isDark={isDark} rippleCount={6} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <LinearGradient
            colors={['#FACC15', '#F59E0B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.searchIcon}
          >
            <IconSymbol name="magnifyingglass" size={14} color="#000000" />
          </LinearGradient>
          <TextInput
            style={[styles.searchInput, { color: isDark ? '#FFFFFF' : '#111827' }]}
            placeholder={t.searchPlaceholder}
            placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconSymbol name="xmark.circle.fill" size={18} color={isDark ? '#666' : '#9CA3AF'} />
            </TouchableOpacity>
          )}
        </View>

        {isEmpty ? (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={['#FACC15', '#F59E0B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyIconContainer}
            >
              <Text style={styles.emptyEmoji}>📋</Text>
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {t.noHistory}
            </Text>
            <Text style={[styles.emptyDesc, { color: isDark ? '#808080' : '#6B7280' }]}>
              {t.noHistoryDesc}
            </Text>
          </View>
        ) : noResults ? (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={['#FACC15', '#F59E0B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyIconContainer}
            >
              <IconSymbol name="magnifyingglass" size={32} color="#000000" />
            </LinearGradient>
            <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
              {t.noResults}
            </Text>
          </View>
        ) : (
          filteredGroups.map((group) => (
            <View key={group.month} style={styles.monthSection}>
              <View
                style={[
                  styles.monthHeader,
                  {
                    backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                  },
                ]}
              >
                <LinearGradient
                  colors={['#FACC15', '#F59E0B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.monthIcon}
                >
                  <IconSymbol name="calendar" size={14} color="#000000" />
                </LinearGradient>
                <Text style={[styles.monthTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {group.month}
                </Text>
                <View
                  style={[
                    styles.countBadge,
                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' },
                  ]}
                >
                  <Text style={[styles.countText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                    {group.entries.length}
                  </Text>
                </View>
              </View>

              <View style={styles.entriesContainer}>
                {group.entries.map((entry) => (
                  <View
                    key={entry.id}
                    style={[
                      styles.entryCard,
                      {
                        backgroundColor: isDark ? 'rgba(30, 30, 30, 0.8)' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                      },
                    ]}
                  >
                    <View style={styles.entryHeader}>
                      <View style={styles.entryLeft}>
                        <Text style={styles.entryEmoji}>{getMoodFace(entry.mood)}</Text>
                        <View>
                          <Text style={[styles.entryDate, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                            {formatDate(entry.date, settings.language)}
                          </Text>
                          <Text style={[styles.entryMoodScore, { color: isDark ? '#808080' : '#6B7280' }]}>
                            {entry.mood}/5
                          </Text>
                        </View>
                      </View>
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          onPress={() => handleEdit(entry)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          style={styles.editButton}
                        >
                          <IconSymbol name="pencil" size={16} color="#FACC15" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDelete(entry.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          style={styles.deleteButton}
                        >
                          <IconSymbol name="trash" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    {entry.note && (
                      <View
                        style={[
                          styles.noteContainer,
                          { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' },
                        ]}
                      >
                        <Text style={[styles.entryNote, { color: isDark ? '#999' : '#6B7280' }]}>
                          {entry.note}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editingEntry !== null}
        transparent
        animationType="fade"
        onRequestClose={handleCloseEdit}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleCloseEdit}
          />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <LinearGradient
                  colors={['#FACC15', '#F59E0B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalIcon}
                >
                  <IconSymbol name="pencil" size={16} color="#000000" />
                </LinearGradient>
                <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {t.editEntry}
                </Text>
              </View>
              <TouchableOpacity onPress={handleCloseEdit} style={styles.closeButton}>
                <IconSymbol name="xmark" size={20} color={isDark ? '#808080' : '#6B7280'} />
              </TouchableOpacity>
            </View>

            {/* Date Display */}
            {editingEntry && (
              <View
                style={[
                  styles.dateDisplay,
                  { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' },
                ]}
              >
                <IconSymbol name="calendar" size={14} color={isDark ? '#808080' : '#6B7280'} />
                <Text style={[styles.dateDisplayText, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {formatDate(editingEntry.date, settings.language)}
                </Text>
              </View>
            )}

            {/* Mood Slider */}
            <View style={styles.fieldSection}>
              <Text style={[styles.fieldLabel, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t.moodScore}
              </Text>
              <View style={styles.moodDisplay}>
                <Text style={styles.moodEmoji}>{getMoodFace(Math.round(editMood))}</Text>
                <Text style={[styles.moodValue, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                  {Math.round(editMood)}/5
                </Text>
              </View>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderLabel}>{MOOD_FACES[1]}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={5}
                  step={1}
                  value={editMood}
                  onValueChange={setEditMood}
                  minimumTrackTintColor="#FACC15"
                  maximumTrackTintColor={isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                  thumbTintColor="#FACC15"
                />
                <Text style={styles.sliderLabel}>{MOOD_FACES[5]}</Text>
              </View>
              <View style={styles.moodScale}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.moodScaleItem,
                      editMood === value && styles.moodScaleItemActive,
                    ]}
                    onPress={() => setEditMood(value)}
                  >
                    <Text style={[styles.moodScaleEmoji, editMood === value && styles.moodScaleEmojiActive]}>
                      {MOOD_FACES[value as MoodScore]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Note Field */}
            <View style={styles.fieldSection}>
              <Text style={[styles.fieldLabel, { color: isDark ? '#FFFFFF' : '#111827' }]}>
                {t.noteLabel}
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                    color: isDark ? '#FFFFFF' : '#111827',
                  },
                ]}
                placeholder={t.notePlaceholder}
                placeholderTextColor={isDark ? '#666' : '#9CA3AF'}
                value={editNote}
                onChangeText={setEditNote}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSaveEdit}
              disabled={saving}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FACC15', '#F59E0B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saveButtonGradient}
              >
                <IconSymbol name="checkmark" size={18} color="#000000" />
                <Text style={styles.saveButtonText}>{saving ? t.saving : t.save}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    gap: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingGradient: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  emptyEmoji: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  monthSection: {
    gap: 10,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  monthIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
  },
  entriesContainer: {
    gap: 10,
    paddingLeft: 12,
  },
  entryCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  entryEmoji: {
    fontSize: 28,
  },
  entryDate: {
    fontSize: 15,
    fontWeight: '600',
  },
  entryMoodScore: {
    fontSize: 13,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  noteContainer: {
    padding: 12,
    borderRadius: 12,
  },
  entryNote: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  dateDisplayText: {
    fontSize: 15,
    fontWeight: '500',
  },
  fieldSection: {
    gap: 10,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  moodDisplay: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  moodEmoji: {
    fontSize: 40,
  },
  moodValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderLabel: {
    fontSize: 18,
  },
  moodScale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  moodScaleItem: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  moodScaleItemActive: {
    backgroundColor: 'rgba(250, 204, 21, 0.2)',
  },
  moodScaleEmoji: {
    fontSize: 22,
    opacity: 0.5,
  },
  moodScaleEmojiActive: {
    opacity: 1,
  },
  textArea: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
  },
  saveButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
