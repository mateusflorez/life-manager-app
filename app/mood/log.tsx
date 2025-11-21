import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemedView } from '@/components/themed-view';
import { useMood } from '@/contexts/mood-context';
import { useSettings } from '@/contexts/settings-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getMoodFace, MOOD_FACES, formatDate } from '@/types/mood';
import type { MoodScore } from '@/types/mood';
import Slider from '@react-native-community/slider';

export default function LogMoodScreen() {
  const { addEntry } = useMood();
  const { settings } = useSettings();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [mood, setMood] = useState<number>(3);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const translations = {
    en: {
      title: "Log today's mood",
      description: 'Choose how the day went (1 = sad, 5 = happy) and leave an optional note.',
      entryDate: 'Entry date',
      moodScore: 'Mood score',
      moodValue: (value: number, face: string) => `${face} Mood: ${value}/5`,
      noteLabel: 'Note (optional)',
      notePlaceholder: 'Optional note about today...',
      saveMood: 'Save mood',
      saving: 'Saving...',
    },
    pt: {
      title: 'Registrar humor de hoje',
      description: 'Escolha como o dia foi (1 = triste, 5 = feliz) e escreva uma nota opcional.',
      entryDate: 'Data do registro',
      moodScore: 'Nota do humor',
      moodValue: (value: number, face: string) => `${face} Humor: ${value}/5`,
      noteLabel: 'Nota (opcional)',
      notePlaceholder: 'Nota opcional sobre o dia...',
      saveMood: 'Salvar humor',
      saving: 'Salvando...',
    },
  };

  const t = translations[settings.language];
  const moodScore = Math.round(mood) as MoodScore;

  const formatDateKey = (d: Date): string => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const handleDateChange = (_event: unknown, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dateKey = formatDateKey(date);
      await addEntry(dateKey, moodScore, note.trim() || undefined);
      router.back();
    } catch (error) {
      console.error('Error saving mood:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
              {t.title}
            </Text>
            <Text style={[styles.description, { color: isDark ? '#999' : '#666' }]}>
              {t.description}
            </Text>
          </View>

          {/* Date Field */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
              {t.entryDate}
            </Text>
            <TouchableOpacity
              style={[
                styles.dateButton,
                {
                  backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5',
                  borderColor: isDark ? '#333' : '#E0E0E0',
                },
              ]}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dateButtonText, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
                {formatDate(formatDateKey(date), settings.language)}
              </Text>
            </TouchableOpacity>
            {(showDatePicker || Platform.OS === 'ios') && (
              <View style={Platform.OS === 'ios' ? styles.iosPickerContainer : undefined}>
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  themeVariant={isDark ? 'dark' : 'light'}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={styles.iosDoneButton}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.iosDoneButtonText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Mood Slider */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
              {t.moodScore}
            </Text>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderLabel}>{MOOD_FACES[1]} 1</Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={5}
                step={1}
                value={mood}
                onValueChange={setMood}
                minimumTrackTintColor="#FACC15"
                maximumTrackTintColor={isDark ? '#333' : '#E0E0E0'}
                thumbTintColor="#FACC15"
              />
              <Text style={styles.sliderLabel}>5 {MOOD_FACES[5]}</Text>
            </View>
            <Text style={[styles.moodValue, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
              {t.moodValue(moodScore, getMoodFace(moodScore))}
            </Text>
          </View>

          {/* Note Field */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: isDark ? '#ECEDEE' : '#11181C' }]}>
              {t.noteLabel}
            </Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5',
                  borderColor: isDark ? '#333' : '#E0E0E0',
                  color: isDark ? '#ECEDEE' : '#11181C',
                },
              ]}
              placeholder={t.notePlaceholder}
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.button, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>{saving ? t.saving : t.saveMood}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 20,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dateButtonText: {
    fontSize: 16,
  },
  iosPickerContainer: {
    backgroundColor: 'transparent',
  },
  iosDoneButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  iosDoneButtonText: {
    color: '#FACC15',
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
    fontSize: 16,
  },
  moodValue: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
  },
  button: {
    backgroundColor: '#FACC15',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
